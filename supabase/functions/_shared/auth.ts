import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface DraftAccess {
  email: string
  role: 'owner' | 'editor' | 'viewer'
}

export async function getDraftAccess(
  supabase: any,
  draftId: string,
  req: Request
): Promise<DraftAccess | null> {
  // Get cookie from request
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  // Parse cookie (simplified - in production use proper cookie parsing)
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const draftCookie = cookies[`draft_${draftId}`]
  if (!draftCookie) return null

  try {
    // In production, verify JWT signature here
    const payload = JSON.parse(atob(draftCookie))
    
    // Check if cookie is for this draft
    if (payload.draftId !== draftId) return null
    
    // Check expiry
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) {
      return null
    }

    return {
      email: payload.email,
      role: payload.role
    }
  } catch (error) {
    console.error('Cookie parsing error:', error)
    return null
  }
}

export async function validateToken(
  supabase: any,
  draftId: string,
  token: string
): Promise<DraftAccess | null> {
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

  if (error || !draft) return null

  // Check if token is expired
  if (new Date(draft.expires_at) < new Date()) return null

  // Check if draft is still active
  if (draft.status !== 'active') return null

  return {
    email: draft.client_email,
    role: 'owner'
  }
}

export function createDraftCookie(
  draftId: string,
  email: string,
  role: string,
  ttlDays: number = 7
): string {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
  
  const payload = {
    draftId,
    email,
    role,
    expiresAt: expiresAt.toISOString()
  }

  // In production, sign this with JWT
  return btoa(JSON.stringify(payload))
}

