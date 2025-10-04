import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

// Simple email sending function (without external dependencies)
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  // For now, just log the email - you can integrate with your email service later
  console.log('Email would be sent:', { to, subject, html })
  
  // If you want to use Resend, uncomment this:
  /*
  const { Resend } = await import('https://esm.sh/resend@2.0.0')
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
  
  const { data, error } = await resend.emails.send({
    from: Deno.env.get('EMAIL_FROM') || 'LP Builder <no-reply@example.com>',
    to: [to],
    subject,
    html
  })
  
  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }
  
  return data
  */
  
  return { success: true }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const action = pathParts[2] // /admin/:action

    // For now, allow all admin operations without authentication
    // In production, you should add proper admin authentication here
    
    switch (action) {
      case 'send-magic-link':
        return await sendMagicLink(req)
      case 'drafts':
        return await getAllDrafts(req)
      case 'stats':
        return await getStats(req)
      default:
        return new Response(
          JSON.stringify({ error: 'Action not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Admin API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendMagicLink(req: Request) {
  const { clientEmail, charityName } = await req.json()
  
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

  // Create initial version with charity info if provided
  const seedConfig = charityName ? {
    charityInfo: {
      charityName: charityName,
      submitterName: clientEmail.split('@')[0], // Use email prefix as default name
      ascendRepresentative: 'Admin Team'
    }
  } : {}

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
      JSON.stringify({ error: 'Failed to create initial version' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate magic link
  const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
  const magicLink = `${baseUrl}/configurator/${draft.id}?token=${tokenString}`

  // Send email (optional - you can implement this based on your email service)
  try {
    await sendEmail({
      to: clientEmail,
      subject: `Your Landing Page Builder Access - ${charityName || 'New Project'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to the Landing Page Builder!</h2>
          <p>You've been invited to create a custom landing page for ${charityName || 'your organization'}.</p>
          <p>Click the link below to get started:</p>
          <a href="${magicLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Start Building Your Page
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 14 days. If you have any questions, please contact our team.
          </p>
        </div>
      `
    })
  } catch (emailError) {
    console.warn('Failed to send email:', emailError)
    // Don't fail the request if email fails
  }

  return new Response(
    JSON.stringify({
      draftId: draft.id,
      magicLink,
      message: 'Magic link sent successfully'
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAllDrafts(req: Request) {
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
      JSON.stringify({ error: 'Failed to fetch drafts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getStats(req: Request) {
  // Get draft statistics
  const { data: drafts, error: draftsError } = await supabase
    .from('drafts')
    .select('status, created_at')

  if (draftsError) {
    console.error('Error fetching draft stats:', draftsError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stats' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get published pages count
  const { count: publishedCount, error: publishedError } = await supabase
    .from('published')
    .select('*', { count: 'exact', head: true })

  if (publishedError) {
    console.error('Error fetching published count:', publishedError)
  }

  // Calculate stats
  const totalDrafts = drafts.length
  const activeDrafts = drafts.filter(d => d.status === 'active').length
  const publishedDrafts = publishedCount || 0

  // This month's drafts
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  
  const thisMonthDrafts = drafts.filter(d => 
    new Date(d.created_at) >= thisMonth
  ).length

  return new Response(
    JSON.stringify({
      totalDrafts,
      activeDrafts,
      publishedDrafts,
      thisMonth: thisMonthDrafts
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}