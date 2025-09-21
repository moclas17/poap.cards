-- POAP Card Database Seed Data
-- Run this after schema.sql to populate demo data

-- Insert demo user
INSERT INTO users (address, ens) VALUES
('0x742d35cc6638c0532925a3b8bcf23eded8df1e3a', 'demo.eth');

-- Insert demo drop
INSERT INTO drops (id, owner_address, name, poap_event_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', '0x742d35cc6638c0532925a3b8bcf23eded8df1e3a', 'POAP Card Demo Event', 12345);

-- Insert demo POAP codes
INSERT INTO poap_codes (drop_id, claim_url, qr_hash) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'https://poap.xyz/mint/abcd1234', 'qr_abcd1234'),
('550e8400-e29b-41d4-a716-446655440000', 'https://poap.xyz/mint/efgh5678', 'qr_efgh5678'),
('550e8400-e29b-41d4-a716-446655440000', 'https://poap.xyz/mint/ijkl9012', 'qr_ijkl9012'),
('550e8400-e29b-41d4-a716-446655440000', 'https://poap.xyz/mint/mnop3456', 'qr_mnop3456'),
('550e8400-e29b-41d4-a716-446655440000', 'https://poap.xyz/mint/qrst7890', 'qr_qrst7890');

-- Insert demo card
INSERT INTO cards (id, ntag_uid, owner_address) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'DEMOUID1234', '0x742d35cc6638c0532925a3b8bcf23eded8df1e3a');

-- Assign demo drop to demo card
INSERT INTO card_drop_assignments (card_id, drop_id) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000');