-- POAP Card Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  ens text,
  created_at timestamptz default now()
);

-- Drops table (POAP event collections)
create table drops (
  id uuid primary key default gen_random_uuid(),
  owner_address text not null,
  name text not null,
  poap_event_id int,
  created_at timestamptz default now()
);

-- POAP codes table (individual claim URLs)
create table poap_codes (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references drops(id) on delete cascade,
  claim_url text not null,
  qr_hash text,
  is_used boolean default false,
  used_by_address text,
  used_by_ens text,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- NFC cards table
create table cards (
  id uuid primary key default gen_random_uuid(),
  ntag_uid text unique not null,
  name text not null,
  owner_address text not null,
  is_assigned boolean default false,
  is_secure boolean default false,
  created_at timestamptz default now()
);

-- Card-Drop assignments table
create table card_drop_assignments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade unique,
  drop_id uuid references drops(id) on delete cascade,
  assigned_at timestamptz default now()
);

-- Card reads table (SDM tap events)
create table card_reads (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  sdm_ctr int not null,
  sdm_cmac text not null unique,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  poap_code_id uuid references poap_codes(id),
  state text check (state in ('reserved','served','minted','invalid')) default 'reserved'
);

-- Indexes for performance
create index on drops(owner_address);
create index on cards(owner_address);
create index on poap_codes(drop_id, is_used);
create index on card_reads(card_id, sdm_ctr);
create index on card_reads(sdm_cmac);
create index on card_drop_assignments(card_id);

-- Enable Row Level Security (RLS) on all tables
alter table users enable row level security;
alter table drops enable row level security;
alter table poap_codes enable row level security;
alter table cards enable row level security;
alter table card_drop_assignments enable row level security;
alter table card_reads enable row level security;

-- RLS Policies

-- Users: can read their own profile
create policy "read_own_user" on users
for select using ( address = current_setting('request.jwt.claims', true)::jsonb->>'addr' );

-- Drops: can read their own drops
create policy "read_own_drops" on drops
for select using ( owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr' );

-- Cards: can read their own cards
create policy "read_own_cards" on cards
for select using ( owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr' );

-- POAP codes: can read codes from drops they own
create policy "read_codes_by_drop_owner" on poap_codes
for select using (
  exists(select 1 from drops d where d.id = poap_codes.drop_id
         and d.owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr')
);

-- Card drop assignments: can read assignments for cards they own
create policy "read_own_card_assignments" on card_drop_assignments
for select using (
  exists(select 1 from cards c where c.id = card_drop_assignments.card_id
         and c.owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr')
);

-- Card reads: can read reads for cards they own
create policy "read_own_card_reads" on card_reads
for select using (
  exists(select 1 from cards c where c.id = card_reads.card_id
         and c.owner_address = current_setting('request.jwt.claims', true)::jsonb->>'addr')
);

-- Note: INSERT/UPDATE/DELETE operations will be handled server-side using Service Role Key
-- No RLS policies needed for mutations as they bypass RLS when using Service Role Key