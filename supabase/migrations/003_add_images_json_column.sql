-- Add images_json column to existing invites table
ALTER TABLE invites 
ADD COLUMN IF NOT EXISTS images_json jsonb DEFAULT '{}'::jsonb;

-- Drop and recreate the view to avoid column order conflicts
DROP VIEW IF EXISTS invites_public;

-- Update the invites_public view to include the new column
CREATE VIEW invites_public AS
SELECT 
  public_token,
  status,
  onboarding_json,
  theme_json,
  overrides_json,
  images_json,
  progress_step,
  progress_pct,
  rev,
  updated_at
FROM invites
WHERE is_deleted = false;

-- Grant access to the view
GRANT SELECT ON invites_public TO anon;
GRANT SELECT ON invites_public TO authenticated;
