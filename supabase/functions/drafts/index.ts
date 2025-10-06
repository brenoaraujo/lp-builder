import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateRequest, getDraftAccess, validateToken } from '../_shared/auth.ts'
import { auditLog } from '../_shared/audit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const draftId = pathParts[1] // /drafts/:id

    console.log('Drafts function called:', {
      method: req.method,
      pathname: url.pathname,
      pathParts: pathParts,
      draftId: draftId
    })

    switch (req.method) {
      case 'POST':
        if (pathParts.length === 1) {
          return await createDraft(req)
        } else if (pathParts.length === 3 && pathParts[2] === 'confirm') {
          return await confirmDraft(draftId, req)
        }
        break
      
      case 'GET':
        if (pathParts.length === 2) {
          return await getDraft(draftId, req)
        }
        break
      
      case 'PATCH':
        if (pathParts.length === 2) {
          return await updateDraft(draftId, req)
        } else if (pathParts.length === 3 && pathParts[2] === 'status') {
          return await updateDraftStatus(draftId, req)
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createDraft(req: Request) {
  const { clientEmail, seedConfig } = await req.json()
  
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
      JSON.stringify({ error: 'Failed to create draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

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
      JSON.stringify({ error: 'Failed to create initial version' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Audit log
  await auditLog(supabase, 'draft', draft.id, 'created', clientEmail, req)

  // Generate magic link
  const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
  const magicLink = `${baseUrl}/configurator/${draft.id}?token=${tokenString}`

  return new Response(
    JSON.stringify({
      draftId: draft.id,
      inviteEmailPreview: clientEmail,
      magicLink
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getDraft(draftId: string, req: Request) {
  // Try cookie-based access first
  let access = await getDraftAccess(supabase, draftId, req)
  
  // If no cookie access, try token-based access
  if (!access) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (token) {
      access = await validateToken(supabase, draftId, token)
    }
  }
  
  if (!access) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

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
      JSON.stringify({ error: 'Failed to fetch draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get collaborators
  const { data: collaborators } = await supabase
    .from('draft_collaborators')
    .select('email, role, invited_at, accepted_at')
    .eq('draft_id', draftId)
    .is('revoked_at', null)

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select('id, path, body, created_by, resolved_at, created_at')
    .eq('draft_id', draftId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  return new Response(
    JSON.stringify({
      config: version.config_json,
      version: version.version,
      collaborators: collaborators || [],
      comments: comments || [],
      me: {
        email: access.email,
        role: access.role
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDraft(draftId: string, req: Request) {
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access || (access.role !== 'editor' && access.role !== 'owner')) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { baseVersion, patch } = await req.json()
  
  if (typeof baseVersion !== 'number') {
    return new Response(
      JSON.stringify({ error: 'baseVersion is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check current version
  const { data: currentVersion } = await supabase
    .from('draft_versions')
    .select('version')
    .eq('draft_id', draftId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (currentVersion && currentVersion.version !== baseVersion) {
    return new Response(
      JSON.stringify({ error: 'Version conflict', currentVersion: currentVersion.version }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create new version
  const newVersion = (currentVersion?.version || 0) + 1
  const { error: versionError } = await supabase
    .from('draft_versions')
    .insert({
      draft_id: draftId,
      version: newVersion,
      config_json: patch,
      author_email: access.email
    })

  if (versionError) {
    console.error('Version update error:', versionError)
    return new Response(
      JSON.stringify({ error: 'Failed to update draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Audit log
  await auditLog(supabase, 'draft', draftId, 'updated', access.email, req)

  return new Response(
    JSON.stringify({ version: newVersion }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function confirmDraft(draftId: string, req: Request) {
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access || access.role !== 'owner') {
    return new Response(
      JSON.stringify({ error: 'Only draft owner can confirm' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get latest version
  const { data: version, error: versionError } = await supabase
    .from('draft_versions')
    .select('config_json')
    .eq('draft_id', draftId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (versionError) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch draft version' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate slug
  const slug = `page-${draftId.slice(0, 8)}`

  // Create published page
  const { data: published, error: publishError } = await supabase
    .from('published')
    .insert({
      draft_id: draftId,
      slug: slug,
      config_json: version.config_json,
      published_by: access.email
    })
    .select()
    .single()

  if (publishError) {
    console.error('Publish error:', publishError)
    return new Response(
      JSON.stringify({ error: 'Failed to publish draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update draft status
  await supabase
    .from('drafts')
    .update({ status: 'confirmed' })
    .eq('id', draftId)

  // Audit log
  await auditLog(supabase, 'draft', draftId, 'confirmed', access.email, req)

  const publicBaseUrl = Deno.env.get('PUBLIC_BASE_URL') || 'http://localhost:3000'
  const publishedUrl = `${publicBaseUrl}/p/${slug}`

  return new Response(
    JSON.stringify({ publishedUrl }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateDraftStatus(draftId: string, req: Request) {
  try {
    console.log('Updating draft status:', draftId)
    
    const { status } = await req.json()
    
    if (!status) {
      return new Response(
        JSON.stringify({ error: 'Status is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the draft status
    const { error: updateError } = await supabase
      .from('drafts')
      .update({ status })
      .eq('id', draftId)

    if (updateError) {
      console.error('Error updating draft status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update draft status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Draft status updated successfully:', draftId, 'to', status)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Draft status updated successfully',
        status: status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update draft status error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

