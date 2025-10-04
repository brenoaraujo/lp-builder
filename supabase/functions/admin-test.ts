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

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  
  console.log('Request received:', {
    method: req.method,
    pathname: url.pathname,
    pathParts: pathParts,
    searchParams: url.searchParams.toString()
  })

  // Simple test response
  return new Response(
    JSON.stringify({
      message: 'Admin function is working!',
      method: req.method,
      pathname: url.pathname,
      pathParts: pathParts,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
})
