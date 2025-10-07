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

serve(async (req) => {
  console.log('Draft-open function called:', req.method, req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const url = new URL(req.url)
    console.log('URL pathname:', url.pathname)
    
    // Better URL parsing - look for the draft ID after 'draft-open'
    const pathParts = url.pathname.split('/').filter(Boolean)
    console.log('Path parts:', pathParts)
    
    // Find the index of 'draft-open' and get the next part
    const draftOpenIndex = pathParts.indexOf('draft-open')
    const draftId = draftOpenIndex !== -1 ? pathParts[draftOpenIndex + 1] : null
    
    const token = url.searchParams.get('token')
    
    console.log('Parsed values:', { draftId, token: token ? 'present' : 'missing' })

    if (!draftId || !token) {
      console.log('Missing values - draftId:', draftId, 'token:', token ? 'present' : 'missing')
      return new Response(
        JSON.stringify({ error: 'Missing draftId or token' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Hash the token
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
    const tokenHashString = Array.from(new Uint8Array(tokenHash), byte => byte.toString(16).padStart(2, '0')).join('')

    // Check if token exists and is valid
    const { data: draft, error } = await supabase
      .from('drafts')
      .select('id, client_email, expires_at, status')
      .eq('id', draftId)
      .eq('token_hash', tokenHashString)
      .single()

    console.log('Database query result:', { draft: draft ? 'found' : 'not found', error })

    if (error || !draft) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Check if token is expired
    if (new Date(draft.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Check if draft is still active
    if (draft.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Draft not active' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Create simple cookie
    const cookie = btoa(JSON.stringify({
      draftId,
      email: draft.client_email,
      role: 'owner',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    }))
    
    // Use SameSite=None for cross-site cookies
    const cookieHeader = `draft_${draftId}=${cookie}; HttpOnly; Secure; SameSite=None; Max-Age=${7 * 24 * 60 * 60}; Path=/`

    console.log('Authentication successful for draft:', draftId)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Authentication successful',
        draftId: draftId
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    )

  } catch (error) {
    console.error('Draft-open function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})