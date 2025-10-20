-- Notion sync trigger: posts the invite token to the Edge Function on insert/update
-- Safe, idempotent; skips deleted rows

-- Enable pg_net for HTTP posts (available on Supabase)
create extension if not exists pg_net;

create or replace function public.notify_notion_sync()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only for non-deleted rows
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and new.is_deleted = false then
    perform net.http_post(
      'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
      json_build_object('token', new.public_token)::text,
      json_build_object('Content-Type','application/json')::json
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tr_notion_sync on public.invites;
create trigger tr_notion_sync
after insert or update of status, onboarding_json, overrides_json, images_json, theme_json, updated_at, is_deleted
on public.invites
for each row execute function public.notify_notion_sync();


