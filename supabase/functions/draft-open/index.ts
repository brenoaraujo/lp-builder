import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateToken, createDraftCookie } from '../_shared/auth.ts'
import { auditLog } from '../_shared/audit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const draftId = pathParts[2] // /draft-open/:id
    const token = url.searchParams.get('token')

    if (!draftId || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing draftId or token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token
    const access = await validateToken(supabase, draftId, token)
    if (!access) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rotate token (invalidate old one, generate new)
    const newToken = crypto.getRandomValues(new Uint8Array(32))
    const newTokenString = Array.from(newToken, byte => byte.toString(16).padStart(2, '0')).join('')
    const newTokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newTokenString))
    const newTokenHashString = Array.from(new Uint8Array(newTokenHash), byte => byte.toString(16).padStart(2, '0')).join('')

    // Update draft with new token
    await supabase
      .from('drafts')
      .update({ token_hash: newTokenHashString })
      .eq('id', draftId)

    // Create cookie
    const cookie = createDraftCookie(draftId, access.email, access.role)
    const cookieHeader = `draft_${draftId}=${cookie}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`

    // Audit log
    await auditLog(supabase, 'draft', draftId, 'opened', access.email, req)

    // Check if this is a fetch request (has Accept header) or a browser redirect
    const acceptHeader = req.headers.get('Accept') || ''
    const isFetchRequest = acceptHeader.includes('application/json') || req.headers.get('Content-Type') === 'application/json'

    if (isFetchRequest) {
      // Return JSON response for fetch requests
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
    } else {
      // Redirect for browser requests
      const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
      const redirectUrl = `${baseUrl}/configurator/${draftId}`

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
          'Set-Cookie': cookieHeader
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

