-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  public_token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'in_progress', 'submitted', 'handed_off', 'void')),
  charity_name text,
  contact_name text,
  contact_email text,
  is_deleted boolean DEFAULT false,
  onboarding_json jsonb DEFAULT '{}'::jsonb,
  theme_json jsonb DEFAULT '{}'::jsonb,
  overrides_json jsonb DEFAULT '{}'::jsonb,
  progress_step text,
  progress_pct int,
  rev int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on public_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_invites_public_token ON invites(public_token);

-- Create index on status for admin queries
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- Create index on is_deleted for filtering
CREATE INDEX IF NOT EXISTS idx_invites_is_deleted ON invites(is_deleted);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invites_updated_at 
  BEFORE UPDATE ON invites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin can do everything (authenticated users)
CREATE POLICY "Admin full access" ON invites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anonymous users can only SELECT and UPDATE rows matching their public_token
-- Note: For anonymous access, we'll use a custom approach since we can't set JWT claims
-- The client will need to filter by public_token in the query itself
CREATE POLICY "Anonymous select by token" ON invites
  FOR SELECT
  TO anon
  USING (is_deleted = false);

CREATE POLICY "Anonymous update by token" ON invites
  FOR UPDATE
  TO anon
  USING (is_deleted = false)
  WITH CHECK (is_deleted = false);

-- Create a view for public access (limited columns)
CREATE VIEW invites_public AS
SELECT 
  public_token,
  status,
  onboarding_json,
  theme_json,
  overrides_json,
  progress_step,
  progress_pct,
  rev,
  updated_at
FROM invites
WHERE is_deleted = false;

-- Grant access to the view
GRANT SELECT ON invites_public TO anon;
GRANT SELECT ON invites_public TO authenticated;
