import CryptoJS from 'crypto-js'

export interface SdmParams {
  uid: string
  ctr: string
  cmac: string
}

export interface SdmVerificationResult {
  isValid: boolean
  reason?: string
}

// Mock verification for development
function mockVerification(params: SdmParams): SdmVerificationResult {
  // Basic validation of parameters
  if (!params.uid || !params.ctr || !params.cmac) {
    return { isValid: false, reason: 'Missing SDM parameters' }
  }

  // In mock mode, consider all properly formatted parameters as valid
  if (params.uid.length >= 8 && params.ctr.match(/^\d+$/) && params.cmac.length >= 8) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'Invalid SDM format' }
}

// Strict NTAG424 DNA SDM verification
function strictVerification(params: SdmParams): SdmVerificationResult {
  try {
    const { uid, ctr, cmac } = params
    const kMasterHex = process.env.K_MASTER_HEX!

    if (!kMasterHex || kMasterHex.length !== 32) {
      throw new Error('Invalid K_MASTER_HEX configuration')
    }

    // Convert UID to bytes for key diversification
    const uidBytes = CryptoJS.enc.Hex.parse(uid)
    const kMaster = CryptoJS.enc.Hex.parse(kMasterHex)

    // Key diversification: K_CMAC = AES(K_MASTER, UID || CONST)
    // Simplified implementation - in production, use proper NTAG424 key diversification
    const diversificationData = uidBytes.concat(CryptoJS.enc.Hex.parse('01'))
    const kCmac = CryptoJS.AES.encrypt(diversificationData, kMaster, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.NoPadding
    }).ciphertext

    // Construct CMAC input: UID || CTR || DATA
    const ctrHex = parseInt(ctr).toString(16).padStart(6, '0')
    const cmacInput = uid + ctrHex

    // Calculate expected CMAC
    const expectedCmac = CryptoJS.HmacSHA256(cmacInput, kCmac)
      .toString(CryptoJS.enc.Hex)
      .substring(0, 16) // Take first 8 bytes

    // Compare with provided CMAC (case insensitive)
    const isValid = expectedCmac.toLowerCase() === cmac.toLowerCase()

    return {
      isValid,
      reason: isValid ? undefined : 'CMAC verification failed'
    }
  } catch (error) {
    console.error('SDM verification error:', error)
    return { isValid: false, reason: 'SDM verification error' }
  }
}

export function verifySdm(params: SdmParams): SdmVerificationResult {
  const mode = process.env.SDM_VERIFY_MODE || 'mock'

  switch (mode) {
    case 'strict':
      return strictVerification(params)
    case 'mock':
    default:
      return mockVerification(params)
  }
}

export function parseSdmParams(searchParams: URLSearchParams): SdmParams | null {
  const uid = searchParams.get('uid')
  const ctr = searchParams.get('ctr')
  const cmac = searchParams.get('cmac')

  if (!uid || !ctr || !cmac) {
    return null
  }

  return { uid, ctr, cmac }
}