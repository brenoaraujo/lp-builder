-- Fix storage policies for service role access
-- Ensure service role can upload to charity-logos bucket

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Service role full access to storage" ON storage.objects;

-- Grant service role access to storage.objects
GRANT ALL ON storage.objects TO service_role;

-- Create explicit policy for service role on storage.objects
CREATE POLICY "Service role full access to storage" ON storage.objects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure service role can access the charity-logos bucket
GRANT ALL ON storage.buckets TO service_role;

-- Also ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'charity-logos',
  'charity-logos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
