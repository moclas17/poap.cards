import { supabaseAdmin } from '@/lib/supabase/admin'

interface PoapTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PoapToken {
  id?: number
  access_token: string
  expires_at: string
  created_at?: string
  updated_at?: string
}

export class PoapAuth {
  private static readonly CLIENT_ID = process.env.POAP_CLIENT_ID!
  private static readonly CLIENT_SECRET = process.env.POAP_CLIENT_SECRET!
  private static readonly API_KEY = process.env.POAP_API_KEY!
  private static readonly AUTH_URL = 'https://auth.accounts.poap.xyz/oauth/token'
  private static readonly AUDIENCE = 'https://api.poap.tech'

  private static checkEnvVars() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET || !this.API_KEY) {
      throw new Error('Missing POAP environment variables')
    }
  }

  /**
   * Get a valid POAP access token from database or refresh if expired
   */
  static async getAccessToken(): Promise<string> {
    const { data: tokenData, error } = await supabaseAdmin
      .from('poap_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (tokenData) {
      const expiresAt = new Date(tokenData.expires_at)
      const now = new Date()
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60)

      if (minutesUntilExpiry > 5) {
        return tokenData.access_token
      }
    }

    const newToken = await this.generateNewToken()
    await this.saveToken(newToken)

    return newToken.access_token
  }

  /**
   * Generate a new access token from POAP OAuth2
   */
  private static async generateNewToken(): Promise<PoapToken> {
    this.checkEnvVars();
    const payload = {
      audience: this.AUDIENCE,
      grant_type: 'client_credentials',
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET
    }

    const response = await fetch(this.AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`POAP token request failed: ${response.status}`)
    }

    const data: PoapTokenResponse = await response.json()
    const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000)

    return {
      access_token: data.access_token,
      expires_at: expiresAt.toISOString()
    }
  }

  /**
   * Save token to database
   */
  private static async saveToken(token: PoapToken): Promise<void> {
    const { error } = await supabaseAdmin
      .from('poap_tokens')
      .insert({
        access_token: token.access_token,
        expires_at: token.expires_at
      })

    if (error) {
      throw new Error('Failed to save POAP token')
    }
  }

  /**
   * Make authenticated request to POAP API
   */
  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken()

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-API-Key': this.API_KEY,
      ...options.headers
    }

    const finalOptions = {
      method: 'GET',
      ...options,
      headers
    }

    return fetch(url, finalOptions)
  }

  /**
   * Get POAP metadata by QR hash - using exact same approach as working PHP code
   */
  static async getPoapMetadata(qrHash: string): Promise<any> {
    const url = `https://api.poap.tech/actions/claim-qr?qr_hash=${qrHash}`
    const response = await this.makeAuthenticatedRequest(url)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`POAP API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  }
}