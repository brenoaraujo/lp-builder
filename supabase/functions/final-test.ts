import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    console.log('Function called:', {
      method: req.method,
      pathname: url.pathname,
      pathParts: pathParts
    })

    // Handle different routes
    if (pathParts[1] === 'stats') {
      return new Response(
        JSON.stringify({
          totalDrafts: 0,
          activeDrafts: 0,
          publishedDrafts: 0,
          thisMonth: 0,
          message: 'Test function working - database not set up yet'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (pathParts[1] === 'drafts') {
      return new Response(
        JSON.stringify({ 
          drafts: [],
          message: 'Test function working - database not set up yet'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (pathParts[1] === 'send-magic-link') {
      const { clientEmail, charityName } = await req.json()
      
      console.log('Magic link request:', { clientEmail, charityName })
      
      // Generate a test magic link
      const testDraftId = 'test-' + Date.now()
      const magicLink = `http://localhost:5174/configurator/${testDraftId}?token=test-token`
      
      return new Response(
        JSON.stringify({
          draftId: testDraftId,
          magicLink,
          message: 'Test magic link created successfully (no email sent)',
          note: 'This is a test version - no database or email configured'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Default response
      return new Response(
        JSON.stringify({
          message: 'Test Admin API is working!',
          availableEndpoints: [
            '/final/stats',
            '/final/drafts', 
            '/final/send-magic-link'
          ],
          method: req.method,
          pathname: url.pathname,
          note: 'This is a test version without database'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Function Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
