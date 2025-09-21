export interface User {
  id: string
  address: string
  ens: string | null
  created_at: string
}

export interface Drop {
  id: string
  owner_address: string
  name: string
  poap_event_id: number | null
  created_at: string
}

export interface PoapCode {
  id: string
  drop_id: string
  claim_url: string
  qr_hash: string | null
  is_used: boolean
  used_by_address: string | null
  used_by_ens: string | null
  used_at: string | null
  created_at: string
}

export interface Card {
  id: string
  ntag_uid: string
  owner_address: string
  created_at: string
}

export interface CardDropAssignment {
  id: string
  card_id: string
  drop_id: string
  assigned_at: string
}

export interface CardRead {
  id: string
  card_id: string
  sdm_ctr: number
  sdm_cmac: string
  first_seen_at: string
  last_seen_at: string
  poap_code_id: string | null
  state: 'reserved' | 'served' | 'minted' | 'invalid'
}

// Extended types with relations
export interface DropWithStats extends Drop {
  total_codes: number
  used_codes: number
  free_codes: number
}

export interface CardWithDrop extends Card {
  drop?: Drop
}

export interface PoapCodeWithUsage extends PoapCode {
  card_reads?: CardRead[]
}