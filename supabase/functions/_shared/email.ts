import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

export async function sendMagicLinkInvite(
  email: string,
  draftId: string,
  token: string,
  role: 'owner' | 'editor' | 'viewer' = 'editor'
) {
  const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
  const magicLink = `${baseUrl}/draft-open/${draftId}?token=${token}`
  
  const roleText = role === 'owner' ? 'owner' : role === 'editor' ? 'editor' : 'viewer'
  
  const { data, error } = await resend.emails.send({
    from: Deno.env.get('EMAIL_FROM') || 'LP Builder <no-reply@example.com>',
    to: [email],
    subject: `You're invited to ${roleText} a page`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to ${roleText} a page</h2>
        <p>You've been invited to collaborate on a landing page. Click the button below to access the page:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Open Page Editor
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${magicLink}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          This link will expire in 14 days. If you have any questions, please contact support.
        </p>
      </div>
    `,
    text: `
You're invited to ${roleText} a page

You've been invited to collaborate on a landing page. Click the link below to access the page:

${magicLink}

This link will expire in 14 days. If you have any questions, please contact support.
    `
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }

  return data
}

export async function sendPublishNotification(
  emails: string[],
  publishedUrl: string,
  summary: string
) {
  const { data, error } = await resend.emails.send({
    from: Deno.env.get('EMAIL_FROM') || 'LP Builder <no-reply@example.com>',
    to: emails,
    subject: 'Page has been published',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Page Published Successfully</h2>
        <p>The landing page has been published and is now live!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${publishedUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Published Page
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${publishedUrl}</p>
        
        ${summary ? `<p><strong>Summary:</strong> ${summary}</p>` : ''}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          This page is now live and accessible to the public.
        </p>
      </div>
    `,
    text: `
Page Published Successfully

The landing page has been published and is now live!

View the page: ${publishedUrl}

${summary ? `Summary: ${summary}` : ''}

This page is now live and accessible to the public.
    `
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }

  return data
}

export async function sendMentionNotification(
  email: string,
  draftId: string,
  snippet: string,
  path: string,
  mentionedBy: string
) {
  const baseUrl = Deno.env.get('SITE_BASE_URL') || 'http://localhost:3000'
  const draftUrl = `${baseUrl}/configurator/${draftId}`
  
  const { data, error } = await resend.emails.send({
    from: Deno.env.get('EMAIL_FROM') || 'LP Builder <no-reply@example.com>',
    to: [email],
    subject: `You were mentioned in a comment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You were mentioned in a comment</h2>
        <p><strong>${mentionedBy}</strong> mentioned you in a comment on <strong>${path}</strong>:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${snippet}"</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${draftUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Comment
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          You're receiving this because you were mentioned in a comment on this page.
        </p>
      </div>
    `,
    text: `
You were mentioned in a comment

${mentionedBy} mentioned you in a comment on ${path}:

"${snippet}"

View the comment: ${draftUrl}

You're receiving this because you were mentioned in a comment on this page.
    `
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }

  return data
}

