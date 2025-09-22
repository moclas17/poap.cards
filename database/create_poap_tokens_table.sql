-- Create poap_tokens table for OAuth2 token storage
CREATE TABLE poap_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on expires_at for efficient queries
CREATE INDEX idx_poap_tokens_expires_at ON poap_tokens(expires_at);

-- Create index on created_at for ordering
CREATE INDEX idx_poap_tokens_created_at ON poap_tokens(created_at);

-- Enable RLS (but no policies needed since this is server-side only)
ALTER TABLE poap_tokens ENABLE ROW LEVEL SECURITY;

-- Optional: Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_poap_tokens_updated_at
  BEFORE UPDATE ON poap_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();