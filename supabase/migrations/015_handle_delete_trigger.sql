-- Ensure the Notion sync trigger runs also when an invite is soft-deleted

-- Drop existing trigger to recreate
DROP TRIGGER IF EXISTS tr_notion_sync ON public.invites;

-- Recreate the trigger function (keeps existing logic but allows calling for deletions)
CREATE OR REPLACE FUNCTION public.notify_notion_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key text;
  result text;
BEGIN
  service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMyNzc5NywiZXhwIjoyMDc0OTAzNzk3fQ.utMz331bJbahS-tu4_L7EBa4Bq4_F-7yIoGH7EDF6k4';

  -- Always call the Edge Function for INSERT/UPDATE; it will decide whether to upsert or archive
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    BEGIN
      SELECT net.http_post(
        'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
        jsonb_build_object('token', NEW.public_token),
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        )
      ) INTO result;
    EXCEPTION WHEN OTHERS THEN
      -- swallow to avoid failing the DB operation
      PERFORM 1;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to include is_deleted updates (already in list but being explicit)
CREATE TRIGGER tr_notion_sync
  AFTER INSERT OR UPDATE OF status, onboarding_json, overrides_json, images_json, theme_json, updated_at, is_deleted
  ON public.invites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_notion_sync();


