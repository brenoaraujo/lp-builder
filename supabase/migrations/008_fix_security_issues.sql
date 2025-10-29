-- Fix security issues for Notion integration

-- 1. Fix the notify_notion_sync function with proper search_path
create or replace function public.notify_notion_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and new.is_deleted = false then
    perform net.http_post(
      'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
      jsonb_build_object('token', new.public_token),
      jsonb_build_object('Content-Type','application/json')
    );
  end if;
  return new;
end;
$$;

-- 2. Fix the update_updated_at_column function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Move pg_net to a dedicated schema (if possible)
-- Note: This might require recreating the extension
-- For now, we'll leave it as is since it's working





