-- Fix admin delete policies for invites table
-- The service key should bypass RLS, but we need to ensure proper policies

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admin full access" ON invites;

-- Create new admin policy that works with service key
-- Service key bypasses RLS, but we need a policy for authenticated users
CREATE POLICY "Admin full access" ON invites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also create a policy for service role (bypasses RLS)
-- This is mainly for documentation, as service key bypasses RLS
CREATE POLICY "Service role full access" ON invites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the table allows service role access
GRANT ALL ON invites TO service_role;
GRANT ALL ON invites TO authenticated;
