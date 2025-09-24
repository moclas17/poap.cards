-- Add email field to poap_codes table
ALTER TABLE poap_codes
ADD COLUMN used_by_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN poap_codes.used_by_email IS 'Email address of the user who claimed this POAP (if available)';