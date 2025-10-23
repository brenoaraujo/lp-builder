-- Force deploy the Notion sync trigger
-- This migration ensures the trigger is properly deployed

-- First, let's check if the function exists and drop it if it does
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_notion_sync') THEN
        DROP FUNCTION public.notify_notion_sync() CASCADE;
    END IF;
END $$;

-- Create the function
CREATE OR REPLACE FUNCTION public.notify_notion_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key text;
BEGIN
  -- Your service role key
  service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMyNzc5NywiZXhwIjoyMDc0OTAzNzk3fQ.utMz331bJbahS-tu4_L7EBa4Bq4_F-7yIoGH7EDF6k4';
  
  -- Only for non-deleted rows
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_deleted = false THEN
    -- Call the Edge Function with proper authorization
    PERFORM net.http_post(
      'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
      jsonb_build_object('token', NEW.public_token),
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS tr_notion_sync ON public.invites;

-- Create the trigger
CREATE TRIGGER tr_notion_sync
  AFTER INSERT OR UPDATE OF status, onboarding_json, overrides_json, images_json, theme_json, updated_at, is_deleted
  ON public.invites
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_notion_sync();

-- Test the trigger by inserting a test record
INSERT INTO public.invites (
  public_token, 
  charity_name, 
  contact_name, 
  contact_email, 
  status, 
  is_deleted
) VALUES (
  'test-trigger-' || extract(epoch from now())::text,
  'Trigger Test',
  'Test Contact',
  'test@example.com',
  'invited',
  false
) ON CONFLICT (public_token) DO NOTHING;
