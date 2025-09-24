-- Add updated_at field to poap_codes table
ALTER TABLE poap_codes
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment for documentation
COMMENT ON COLUMN poap_codes.updated_at IS 'Timestamp when this record was last updated by cron job or other processes';