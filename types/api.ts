// Authentication types
export interface NonceResponse {
  nonce: string
}

export interface VerifyRequest {
  message: string
  signature: string
  address: string
}

export interface VerifyResponse {
  success: boolean
  address: string
}

// NFC Tap types
export interface TapResponse {
  status: 'served' | 'minted' | 'error'
  claimUrl?: string
  codeId?: string
  reason?: string
}

export type TapErrorReason =
  | 'missing_sdm_params'
  | 'sdm_invalid'
  | 'unclaimed_card'
  | 'unassigned_drop'
  | 'no_codes'
  | 'database_error'
  | 'internal_error'

// Claim confirmation types
export interface ConfirmRequest {
  codeId: string
  claimer: string
}

export interface ConfirmResponse {
  success: boolean
  claimer: string
  ensName?: string | null
}

// Cards API types
export interface ClaimCardRequest {
  cardUid: string
}

export interface AssignDropRequest {
  dropId: string
}

// Drops API types
export interface DropStats {
  id: string
  name: string
  description?: string
  image_url?: string
  total: number
  used: number
  free: number
}