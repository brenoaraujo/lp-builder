-- Fix storage policies for charity-logos bucket
-- Allow anonymous users to upload files to charity-logos bucket

-- Create the charity-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'charity-logos',
  'charity-logos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to upload files to charity-logos bucket
CREATE POLICY "Allow anonymous uploads to charity-logos" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'charity-logos');

-- Allow anonymous users to update files in charity-logos bucket
CREATE POLICY "Allow anonymous updates to charity-logos" ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'charity-logos')
  WITH CHECK (bucket_id = 'charity-logos');

-- Allow anonymous users to delete files in charity-logos bucket
CREATE POLICY "Allow anonymous deletes to charity-logos" ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'charity-logos');

-- Allow anonymous users to select files in charity-logos bucket
CREATE POLICY "Allow anonymous selects from charity-logos" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'charity-logos');

-- Allow authenticated users full access to charity-logos bucket
CREATE POLICY "Allow authenticated full access to charity-logos" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'charity-logos')
  WITH CHECK (bucket_id = 'charity-logos');
