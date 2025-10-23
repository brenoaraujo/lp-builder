-- Fix the trigger specifically for INSERT operations
-- The issue is that the trigger is not firing for INSERT operations from the UI

-- Drop the existing trigger
DROP TRIGGER IF EXISTS tr_notion_sync ON public.invites;

-- Recreate the trigger function with explicit INSERT handling
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
  -- Your service role key
  service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMyNzc5NywiZXhwIjoyMDc0OTAzNzk3fQ.utMz331bJbahS-tu4_L7EBa4Bq4_F-7yIoGH7EDF6k4';
  
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired: % on invite %', TG_OP, NEW.public_token;
  
  -- Handle both INSERT and UPDATE operations
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    RAISE NOTICE 'INSERT operation detected for token: %', NEW.public_token;
    
    BEGIN
      -- Call the Edge Function with proper authorization
      SELECT net.http_post(
        'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
        jsonb_build_object('token', NEW.public_token),
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        )
      ) INTO result;
      
      RAISE NOTICE 'Edge Function called successfully for INSERT token: %', NEW.public_token;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Edge Function call failed for INSERT token %: %', NEW.public_token, SQLERRM;
    END;
    
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = false THEN
    RAISE NOTICE 'UPDATE operation detected for token: %', NEW.public_token;
    
    BEGIN
      -- Call the Edge Function with proper authorization
      SELECT net.http_post(
        'https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync',
        jsonb_build_object('token', NEW.public_token),
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        )
      ) INTO result;
      
      RAISE NOTICE 'Edge Function called successfully for UPDATE token: %', NEW.public_token;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Edge Function call failed for UPDATE token %: %', NEW.public_token, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger with explicit INSERT handling
CREATE TRIGGER tr_notion_sync
  AFTER INSERT OR UPDATE OF status, onboarding_json, overrides_json, images_json, theme_json, updated_at, is_deleted
  ON public.invites
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_notion_sync();

-- Test the trigger with a new insert
INSERT INTO public.invites (
  public_token, 
  charity_name, 
  contact_name, 
  contact_email, 
  status, 
  is_deleted
) VALUES (
  'insert-test-' || extract(epoch from now())::text,
  'Insert Test Final',
  'Test Contact',
  'insert@test.com',
  'invited',
  false
) ON CONFLICT (public_token) DO NOTHING;
