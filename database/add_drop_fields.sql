-- Add missing fields to drops table
ALTER TABLE drops
ADD COLUMN description text,
ADD COLUMN image_url text,
ADD COLUMN total_codes integer DEFAULT 0;