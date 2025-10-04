import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getDraftAccess } from '../_shared/auth.ts'
import { auditLog } from '../_shared/audit.ts'
import { sendMagicLinkInvite } from '../_shared/email.ts'

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
    const draftId = pathParts[2] // /collaborators/:draftId
    const collabId = pathParts[3] // /collaborators/:draftId/:collabId

    switch (req.method) {
      case 'POST':
        return await inviteCollaborators(draftId, req)
      
      case 'DELETE':
        if (collabId) {
          return await revokeCollaborator(draftId, collabId, req)
        }
        break
      
      case 'GET':
        return await listCollaborators(draftId, req)
    }

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

async function inviteCollaborators(draftId: string, req: Request) {
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access || access.role !== 'owner') {
    return new Response(
      JSON.stringify({ error: 'Only draft owner can invite collaborators' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { emails, role } = await req.json()
  
  if (!Array.isArray(emails) || !emails.length) {
    return new Response(
      JSON.stringify({ error: 'emails array is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!['viewer', 'editor'].includes(role)) {
    return new Response(
      JSON.stringify({ error: 'role must be viewer or editor' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const invited = []

  for (const email of emails) {
    // Generate token for this collaborator
    const token = crypto.getRandomValues(new Uint8Array(32))
    const tokenString = Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('')
    const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString))
    const tokenHashString = Array.from(new Uint8Array(tokenHash), byte => byte.toString(16).padStart(2, '0')).join('')

    // Create or update collaborator
    const { data: collaborator, error: collabError } = await supabase
      .from('draft_collaborators')
      .upsert({
        draft_id: draftId,
        email: email,
        role: role,
        token_hash: tokenHashString,
        invited_at: new Date().toISOString(),
        accepted_at: null,
        revoked_at: null
      }, {
        onConflict: 'draft_id,email'
      })
      .select()
      .single()

    if (collabError) {
      console.error('Collaborator creation error:', collabError)
      continue
    }

    // Send magic link email
    try {
      await sendMagicLinkInvite(email, draftId, tokenString, role)
      invited.push({ email, role, id: collaborator.id })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      // Still count as invited, but email failed
      invited.push({ email, role, id: collaborator.id, emailError: true })
    }
  }

  // Audit log
  await auditLog(supabase, 'draft', draftId, 'collaborators_invited', access.email, req)

  return new Response(
    JSON.stringify({ invited }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function revokeCollaborator(draftId: string, collabId: string, req: Request) {
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access || access.role !== 'owner') {
    return new Response(
      JSON.stringify({ error: 'Only draft owner can revoke collaborators' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Revoke collaborator
  const { error } = await supabase
    .from('draft_collaborators')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', collabId)
    .eq('draft_id', draftId)

  if (error) {
    console.error('Revoke error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to revoke collaborator' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Audit log
  await auditLog(supabase, 'draft', draftId, 'collaborator_revoked', access.email, req)

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listCollaborators(draftId: string, req: Request) {
  const access = await getDraftAccess(supabase, draftId, req)
  
  if (!access) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get collaborators
  const { data: collaborators, error } = await supabase
    .from('draft_collaborators')
    .select('id, email, role, invited_at, accepted_at, revoked_at')
    .eq('draft_id', draftId)
    .is('revoked_at', null)
    .order('invited_at', { ascending: false })

  if (error) {
    console.error('Collaborators fetch error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch collaborators' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ collaborators: collaborators || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

