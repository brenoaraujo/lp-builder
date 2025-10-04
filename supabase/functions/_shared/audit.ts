import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function auditLog(
  supabase: any,
  entityType: string,
  entityId: string,
  action: string,
  byEmail: string | null,
  req: Request
) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  await supabase
    .from('audit')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      by_email: byEmail,
      ip: ip,
      user_agent: userAgent
    })
}

