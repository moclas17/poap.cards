-- Add failed_checks field to poap_codes table for 2-strike system
ALTER TABLE poap_codes
ADD COLUMN failed_checks integer DEFAULT 0;