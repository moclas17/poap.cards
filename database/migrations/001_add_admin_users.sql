-- Add is_admin field to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;

-- Create index for admin queries
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Mark the specified wallet as admin
INSERT INTO users (address, is_admin)
VALUES ('0x0e88ac34917a6bf5e36bfdc2c6c658e58078a1e6', true)
ON CONFLICT (address)
DO UPDATE SET is_admin = true;

-- Create RLS policy for admins to read all users
CREATE POLICY "admins_read_all_users" ON users
FOR SELECT USING (
  is_admin = true AND
  address = current_setting('request.jwt.claims', true)::jsonb->>'addr'
);

-- Comment: Admins can now read all users through this policy
-- Regular users can still only read their own profile via "read_own_user" policy
