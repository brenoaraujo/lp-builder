import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lp-builder-pi.vercel.app',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Vary': 'Origin',
}

// FIXED: Cookie parser that preserves = in base64 values
async function getDraftAccess(supabase: any, draftId: string, req: Request) {
  const cookieHeader = req.headers.get('Cookie')
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...rest] = c.trim().split('=')
      return [key, rest.join('=')] // preserve '=' inside the value
    })
  )

  const draftCookie = cookies[`draft_${draftId}`]
  if (!draftCookie) return null

  try {
    const payload = JSON.parse(atob(draftCookie))
    
    // Check if cookie is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return {
      email: payload.email,
      role: payload.role
    }
  } catch {
    return null
  }
}

serve(async (req) => {
  console.log('Drafts function called:', req.method, req.url)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Robust draftId extraction - works with both /drafts/:id and /functions/v1/drafts/:id
    const draftIdMatch = url.pathname.match(/\/drafts\/([^\/\?]+)/)
    const draftId = draftIdMatch ? draftIdMatch[1] : null

    console.log('Path parts:', pathParts, 'draftId:', draftId)

    switch (req.method) {
      case 'POST':
        if (!draftId) {
          // POST /drafts (create new draft)
          return await createDraft(req)
        } else if (url.pathname.includes('/confirm')) {
          // POST /drafts/:id/confirm
          return await confirmDraft(draftId, req)
        }
        break
      
      case 'GET':
        if (draftId) {
          // GET /drafts/:id
          return await getDraft(draftId, req)
        }
        break
      
      case 'PATCH':
        if (draftId) {
          if (url.pathname.includes('/status')) {
            // PATCH /drafts/:id/status
            return await updateDraftStatus(draftId, req)
          } else {
            // PATCH /drafts/:id
            return await updateDraft(draftId, req)
          }
        }
        break
    }

    // If no route matched, return method not allowed
    console.log('No matching route found for:', req.method, pathParts.length)
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Drafts function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createDraft(req: Request) {
  console.log('Creating draft...')
  
  try {
    const { clientEmail, seedConfig } = await req.json()
    console.log('Request data:', { clientEmail, seedConfig })
    
    if (!clientEmail || typeof clientEmail !== 'string') {
      return new Response(
        JSON.stringify({ error: 'clientEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate random token
    const token = crypto.getRandomValues(new Uint8Array(32))
    const tokenString = Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('')
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString))
    const tokenHashString = Array.from(new Uint8Array(tokenHash), byte => byte.toString(16).padStart(2, '0')).join('')

    console.log('Generated token for:', clientEmail)

    // Create draft
    const { data: draft, error: draftError } = await supabase
      .from('drafts')
      .insert({
        client_email: clientEmail,
        token_hash: tokenHashString,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
      })
      .select()
      .single()

    if (draftError) {
      console.error('Draft creation error:', draftError)
      return new Response(
        JSON.stringify({ error: 'Failed to create draft', details: draftError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Draft created:', draft.id)

    // Create initial version
    const { error: versionError } = await supabase
      .from('draft_versions')
      .insert({
        draft_id: draft.id,
        version: 1,
        config_json: seedConfig || {},
        author_email: clientEmail
      })

    if (versionError) {
      console.error('Version creation error:', versionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create initial version', details: versionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Initial version created for draft:', draft.id)

    // Generate magic link
    const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
    const magicLink = `${baseUrl}/configurator/${draft.id}?token=${tokenString}`

    console.log('Magic link generated:', magicLink)

    return new Response(
      JSON.stringify({
        draftId: draft.id,
        inviteEmailPreview: clientEmail,
        magicLink
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create draft error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create draft', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getDraft(draftId: string, req: Request) {
  console.log('Getting draft:', draftId)
  
  // Try cookie-based access
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access) {
    console.log('Access denied for draft:', draftId)
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Access granted for draft:', draftId, 'by:', access.email)

  // Get latest version
  const { data: version, error: versionError } = await supabase
    .from('draft_versions')
    .select('config_json, version, created_at, author_email')
    .eq('draft_id', draftId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (versionError) {
    console.error('Version fetch error:', versionError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch draft', details: versionError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      config: version.config_json,
      version: version.version,
      collaborators: [],
      comments: [],
      me: access
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDraft(draftId: string, req: Request) {
  console.log('Updating draft:', draftId)
  
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { baseVersion, patch } = await req.json()

  // Get current version
  const { data: currentVersion, error: versionError } = await supabase
    .from('draft_versions')
    .select('version')
    .eq('draft_id', draftId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (versionError) {
    return new Response(
      JSON.stringify({ error: 'Failed to get current version' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check version conflict
  if (currentVersion.version !== baseVersion) {
    return new Response(
      JSON.stringify({ 
        error: 'Version conflict', 
        currentVersion: currentVersion.version 
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create new version
  const { data: newVersion, error: createError } = await supabase
    .from('draft_versions')
    .insert({
      draft_id: draftId,
      version: currentVersion.version + 1,
      config_json: patch,
      author_email: access.email
    })
    .select()
    .single()

  if (createError) {
    console.error('Version creation error:', createError)
    return new Response(
      JSON.stringify({ error: 'Failed to create new version' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      version: newVersion.version
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function confirmDraft(draftId: string, req: Request) {
  console.log('Confirming draft:', draftId)
  
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update draft status to confirmed
  const { error: updateError } = await supabase
    .from('drafts')
    .update({ status: 'confirmed' })
    .eq('id', draftId)

  if (updateError) {
    console.error('Draft confirmation error:', updateError)
    return new Response(
      JSON.stringify({ error: 'Failed to confirm draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDraftStatus(draftId: string, req: Request) {
  console.log('Updating draft status:', draftId)
  
  const { status } = await req.json()

  const { error: updateError } = await supabase
    .from('drafts')
    .update({ status })
    .eq('id', draftId)

  if (updateError) {
    console.error('Status update error:', updateError)
    return new Response(
      JSON.stringify({ error: 'Failed to update status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}