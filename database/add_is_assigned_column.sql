-- Add is_assigned column to cards table
-- This column tracks whether a card is currently assigned to a drop

ALTER TABLE cards ADD COLUMN is_assigned boolean DEFAULT false;

-- Update existing cards that have assignments
UPDATE cards
SET is_assigned = true
WHERE id IN (
  SELECT DISTINCT card_id
  FROM card_drop_assignments
);

-- Add index for performance
CREATE INDEX idx_cards_is_assigned ON cards(is_assigned);
CREATE INDEX idx_cards_owner_assigned ON cards(owner_address, is_assigned);