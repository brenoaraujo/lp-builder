-- Fix the Notion sync trigger to ensure it works properly
-- This migration fixes the trigger function and ensures it has proper authorization

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS tr_notion_sync ON public.invites;
DROP FUNCTION IF EXISTS public.notify_notion_sync() CASCADE;

-- Create the fixed trigger function with proper authorization
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

-- Create the trigger
CREATE TRIGGER tr_notion_sync
  AFTER INSERT OR UPDATE OF status, onboarding_json, overrides_json, images_json, theme_json, updated_at, is_deleted
  ON public.invites
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_notion_sync();
