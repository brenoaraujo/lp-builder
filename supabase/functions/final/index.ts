import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersNoCredentials } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersNoCredentials })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    console.log('Admin function called:', {
      method: req.method,
      pathname: url.pathname,
      pathParts: pathParts
    })

    // Handle different routes
    if (pathParts[1] === 'stats') {
      return await getStats(req)
    } else if (pathParts[1] === 'drafts') {
      if (pathParts[2] && req.method === 'DELETE') {
        return await deleteDraft(req, pathParts[2])
      } else {
        return await getAllDrafts(req)
      }
    } else if (pathParts[1] === 'send-magic-link') {
      return await sendMagicLink(req)
    } else {
      // Default response for base admin endpoint
      return new Response(
        JSON.stringify({
          message: 'Admin API is working!',
          availableEndpoints: [
            '/admin/stats',
            '/admin/drafts', 
            '/admin/send-magic-link'
          ],
          method: req.method,
          pathname: url.pathname
        }),
        { status: 200, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Admin API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendMagicLink(req: Request) {
  try {
    const { clientEmail, charityName } = await req.json()
    
    if (!clientEmail || typeof clientEmail !== 'string') {
      return new Response(
        JSON.stringify({ error: 'clientEmail is required' }),
        { status: 400, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: 'Failed to create draft', details: draftError.message }),
        { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
      )
    }

    // Create initial version with charity info if provided
    const seedConfig = charityName ? {
      charityInfo: {
        charityName: charityName,
        submitterName: clientEmail.split('@')[0], // Use email prefix as default name
        ascendRepresentative: 'Admin Team'
      },
      overridesBySection: {
        hero: { visible: true, variant: "A" },
        extraPrizes: { visible: true, variant: "A" },
        winners: { visible: true, variant: "A" }
        // WhoYouHelp is NOT included by default
      },
      theme: {
        colors: {},
        mode: 'light'
      }
    } : {
      overridesBySection: {
        hero: { visible: true, variant: "A" },
        extraPrizes: { visible: true, variant: "A" },
        winners: { visible: true, variant: "A" }
        // WhoYouHelp is NOT included by default
      },
      theme: {
        colors: {},
        mode: 'light'
      }
    }

    const { error: versionError } = await supabase
      .from('draft_versions')
      .insert({
        draft_id: draft.id,
        version: 1,
        config_json: seedConfig,
        author_email: clientEmail
      })

    if (versionError) {
      console.error('Version creation error:', versionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create initial version', details: versionError.message }),
        { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
      )
    }

    // Generate magic link
    const baseUrl = Deno.env.get('SITE_BASE_URL') || 'https://your-production-url.com'
    const magicLink = `${baseUrl}/configurator/${draft.id}?token=${tokenString}`

    // Email sending is disabled for testing - just log the magic link
    console.log('Magic link created for:', clientEmail)
    console.log('Magic link:', magicLink)
    
    // TODO: Re-enable email sending when ready for production
    // const emailResult = await sendEmail({...})

    return new Response(
      JSON.stringify({
        draftId: draft.id,
        magicLink,
        message: 'Magic link created successfully'
      }),
        { status: 201, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in sendMagicLink:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  }
}

async function getAllDrafts(req: Request) {
  try {
    // Get all drafts with their latest version
    const { data: drafts, error } = await supabase
      .from('drafts')
      .select(`
        id,
        status,
        client_email,
        created_at,
        updated_at,
        expires_at,
        draft_versions!inner(
          version,
          config_json,
          created_at,
          author_email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching drafts:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch drafts', details: error.message }),
        { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
      )
    }

    // Process drafts to get latest version for each
    const processedDrafts = drafts.map(draft => {
      const versions = Array.isArray(draft.draft_versions) ? draft.draft_versions : [draft.draft_versions]
      const latestVersion = versions.reduce((latest, version) => 
        version.version > latest.version ? version : latest
      )

      return {
        id: draft.id,
        status: draft.status,
        client_email: draft.client_email,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
        expires_at: draft.expires_at,
        latestVersion: {
          version: latestVersion.version,
          config_json: latestVersion.config_json,
          created_at: latestVersion.created_at,
          author_email: latestVersion.author_email
        }
      }
    })

    return new Response(
      JSON.stringify({ drafts: processedDrafts }),
      { status: 200, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getAllDrafts:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  }
}

async function getStats(req: Request) {
  try {
    // For now, return mock stats since database might not be set up
    return new Response(
      JSON.stringify({
        totalDrafts: 0,
        activeDrafts: 0,
        publishedDrafts: 0,
        thisMonth: 0,
        message: 'Database not set up yet - returning mock stats'
      }),
      { status: 200, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getStats:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error', details: error.message }),
      { status: 500, headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } }
    )
  }
}

// Simple email sending function (using same config as handoff API)
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  console.log('sendEmail called with:', { to, subject: subject.substring(0, 50) + '...' })
  
  // Use same Resend configuration as handoff API
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  let fromAddress = Deno.env.get('RESEND_FROM') || 'LP Builder <onboarding@resend.dev>'
  
  // Clean up the from address - remove any extra text in parentheses
  fromAddress = fromAddress.replace(/\s*\([^)]*\)\s*$/, '').trim()
  
  console.log('Environment check:', {
    hasResendApiKey: !!resendApiKey,
    resendApiKeyLength: resendApiKey ? resendApiKey.length : 0,
    fromAddress: fromAddress,
    resendApiKeyPrefix: resendApiKey ? resendApiKey.substring(0, 10) + '...' : 'none'
  })
  
  if (resendApiKey) {
    try {
      console.log('Importing Resend...')
      const { Resend } = await import('https://esm.sh/resend@1.1.0')
      const resend = new Resend(resendApiKey)

      console.log('Sending email via Resend...')
      console.log('Email details:', {
        from: fromAddress,
        to: [to],
        subject: subject.substring(0, 50) + '...',
        htmlLength: html.length
      })
      
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html,
      })

      console.log('Resend response:', { data, error })

      if (error) {
        console.error('Resend email error:', error)
        return { success: false, error: error.message }
      }

      console.log('Resend email sent successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Resend integration error:', error)
      return { success: false, error: error.message }
    }
  } else {
    console.log('No RESEND_API_KEY found, email not sent')
    return { success: true, message: 'Email logged, not actually sent (no API key)' }
  }
}

async function deleteDraft(req: Request, draftId: string) {
  try {
    console.log('Deleting draft:', draftId)

    // Delete the draft and all its versions
    const { error: draftError } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)

    if (draftError) {
      console.error('Error deleting draft:', draftError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete draft' }),
        { 
          status: 500, 
          headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Draft deleted successfully:', draftId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Draft deleted successfully',
        draftId: draftId
      }),
      { 
        status: 200, 
        headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Delete draft error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeadersNoCredentials, 'Content-Type': 'application/json' } 
      }
    )
  }
}
