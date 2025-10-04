# Supabase Setup for Logo Upload

## 1. Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://kvtouoigckngalfvzmsp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjc3OTcsImV4cCI6MjA3NDkwMzc5N30.i67Sfnl2PA4Pj5OcToT28o2bqpmLYtPbXasuNuExve0
```

You can find these values in your Supabase project settings under "API".

## 2. Storage Bucket Setup

In your Supabase dashboard:

1. Go to **Storage** in the left sidebar
2. Create a new bucket called `charity-logos`
3. Set the bucket to **Public** (so uploaded images can be accessed via URL)
4. Configure the following policies:

### Policy 1: Allow public read access
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'charity-logos');
```

### Policy 2: Allow authenticated uploads
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'charity-logos');
```

### Policy 3: Allow users to update their own uploads
```sql
CREATE POLICY "Allow users to update own uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'charity-logos');
```

### Policy 4: Allow users to delete their own uploads
```sql
CREATE POLICY "Allow users to delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'charity-logos');
```

## 3. File Size Limits

The component is configured to accept files up to 5MB. If you need to change this:

1. Update the `maxSize` constant in `src/components/LogoUpload.jsx`
2. Update the Supabase storage limits in your project settings if needed

## 4. Supported File Types

Currently supports:
- PNG
- JPG/JPEG  
- SVG

To add more types, update the `allowedTypes` array in `src/components/LogoUpload.jsx`.

## 5. Testing

Once configured:
1. Start the development server: `npm run dev`
2. Go to the onboarding flow
3. Select or enter a charity name
4. Try uploading a logo file
5. The logo should appear in the preview and be saved to localStorage

## Troubleshooting

- **Upload fails**: Check that your Supabase URL and key are correct
- **Images not displaying**: Ensure the bucket is set to public
- **File too large**: Check file size limits in both the component and Supabase settings
- **CORS errors**: Make sure your Supabase project allows requests from your domain
