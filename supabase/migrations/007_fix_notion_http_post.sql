-- Fix http_post signature to use jsonb for body and headers
create extension if not exists pg_net;

create or replace function public.notify_notion_sync()
returns trigger
language plpgsql
security definer
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


