-- Add images_json column to existing invites table
ALTER TABLE invites 
ADD COLUMN IF NOT EXISTS images_json jsonb DEFAULT '{}'::jsonb;

-- Update the invites_public view to include the new column
CREATE OR REPLACE VIEW invites_public AS
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
