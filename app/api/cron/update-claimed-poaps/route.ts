import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PoapAuth } from '@/lib/poap/auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ClaimResult {
  qr_hash: string
  success: boolean
  user_address?: string
  user_ens?: string
  user_email?: string
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (Vercel Cron or manual with secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const vercelCronHeader = request.headers.get('x-vercel-cron')

    // Debug logs
    console.log('🔍 CRON DEBUG INFO:')
    console.log('authHeader:', authHeader)
    console.log('cronSecret exists:', !!cronSecret)
    console.log('cronSecret length:', cronSecret?.length)
    console.log('vercelCronHeader:', vercelCronHeader)
    console.log('expected Bearer format:', `Bearer ${cronSecret}`)
    console.log('authHeader matches:', authHeader === `Bearer ${cronSecret}`)

    // Allow Vercel Cron calls or manual calls with correct secret
    const isVercelCron = vercelCronHeader === '1'
    const isAuthorizedManual = cronSecret && authHeader === `Bearer ${cronSecret}`

    console.log('isVercelCron:', isVercelCron)
    console.log('isAuthorizedManual:', isAuthorizedManual)

    if (!isVercelCron && !isAuthorizedManual) {
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          hasAuthHeader: !!authHeader,
          hasCronSecret: !!cronSecret,
          hasVercelCron: !!vercelCronHeader,
          authHeaderReceived: authHeader,
          expectedFormat: `Bearer ${cronSecret}`
        }
      }, { status: 401 })
    }


    // Process POAPs that have NO user data at all (no address, no ENS, no email)
    const { data: claimedCodes, error: fetchError } = await supabase
      .from('poap_codes')
      .select('qr_hash, mint_url, used_by_address, used_by_ens, used_by_email, failed_checks')
      .eq('is_used', true)
      .not('mint_url', 'is', null)
      .is('used_by_address', null)
      .is('used_by_ens', null)
      .is('used_by_email', null)
      .limit(50) // Process more since this will run every 5 minutes

    if (fetchError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!claimedCodes || claimedCodes.length === 0) {
      return NextResponse.json({
        message: 'No claimed POAPs need updating - all have addresses and ENS',
        processed: 0
      })
    }

    const results: ClaimResult[] = []
    let successCount = 0
    let errorCount = 0

    // Process each claimed POAP
    for (const code of claimedCodes) {
      try {

        // Get claim information from POAP API (all POAPs here have no user data)
        const claimInfo = await getClaimInfo(code.qr_hash)

        if (claimInfo.success && (claimInfo.user_address || claimInfo.user_email)) {
          // Try to get ENS name for the address if not already provided
          let ensName: string | undefined = claimInfo.user_ens
          if (!ensName && claimInfo.user_address) {
            const resolvedEns = await getEnsName(claimInfo.user_address)
            ensName = resolvedEns || undefined
          }

          // Update the database with user information and reset failed_checks
          const { error: updateError } = await supabase
            .from('poap_codes')
            .update({
              used_by_address: claimInfo.user_address,
              used_by_ens: ensName || null,
              used_by_email: claimInfo.user_email || null,
              failed_checks: 0,
              updated_at: new Date().toISOString()
            })
            .eq('qr_hash', code.qr_hash)

          if (updateError) {
            errorCount++
            results.push({
              qr_hash: code.qr_hash,
              success: false,
              error: updateError.message
            })
          } else {
            successCount++
            results.push({
              qr_hash: code.qr_hash,
              success: true,
              user_address: claimInfo.user_address,
              user_ens: ensName,
              user_email: claimInfo.user_email
            })
          }
        } else {
          // Increment failed_checks counter
          const currentFailedChecks = code.failed_checks || 0
          const newFailedChecks = currentFailedChecks + 1

          if (newFailedChecks >= 2) {
            // Unmark the POAP after 2 consecutive failures
            const { error: unmarkError } = await supabase
              .from('poap_codes')
              .update({
                is_used: false,
                mint_url: null,
                used_at: null,
                failed_checks: 0,
                updated_at: new Date().toISOString()
              })
              .eq('qr_hash', code.qr_hash)

            if (unmarkError) {
              results.push({
                qr_hash: code.qr_hash,
                success: false,
                error: `Failed to unmark: ${unmarkError.message}`
              })
              errorCount++
            } else {
              results.push({
                qr_hash: code.qr_hash,
                success: true,
                error: 'Unmarked after 2 failed checks'
              })
              successCount++
            }
          } else {
            // Just increment the failed_checks counter
            const { error: incrementError } = await supabase
              .from('poap_codes')
              .update({
                failed_checks: newFailedChecks,
                updated_at: new Date().toISOString()
              })
              .eq('qr_hash', code.qr_hash)

            if (incrementError) {
              results.push({
                qr_hash: code.qr_hash,
                success: false,
                error: `Failed to increment counter: ${incrementError.message}`
              })
              errorCount++
            } else {
              results.push({
                qr_hash: code.qr_hash,
                success: true,
                error: `Failed check ${newFailedChecks}/2 - waiting for next check`
              })
              successCount++
            }
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        errorCount++
        results.push({
          qr_hash: code.qr_hash,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }


    return NextResponse.json({
      message: 'Claimed POAPs update completed',
      processed: claimedCodes.length,
      success: successCount,
      errors: errorCount,
      results
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getClaimInfo(qrHash: string): Promise<{
  success: boolean
  user_address?: string
  user_ens?: string
  user_email?: string
  error?: string
}> {
  try {
    // Get access token
    const accessToken = await PoapAuth.getAccessToken()

    // Make request to POAP API to get claim information
    const response = await fetch(`https://api.poap.tech/actions/claim-qr?qr_hash=${qrHash}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'x-api-key': process.env.POAP_API_KEY!
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'POAP not found or not claimed yet'
        }
      }

      return {
        success: false,
        error: `API error: ${response.status}`
      }
    }

    const claimData = await response.json()

    // Extract user information from the response
    // The exact structure may vary, so we need to handle different possible responses
    let userAddress: string | undefined
    let userEns: string | undefined
    let userEmail: string | undefined

    // Try to get address from different possible fields
    if (claimData.owner) {
      userAddress = claimData.owner
    } else if (claimData.beneficiary) {
      userAddress = claimData.beneficiary
    } else if (claimData.to) {
      userAddress = claimData.to
    }

    // Try to get ENS if available
    if (claimData.ens || claimData.ensName) {
      userEns = claimData.ens || claimData.ensName
    }

    // Try to get email from user_input field (main field for email)
    if (claimData.user_input) {
      userEmail = claimData.user_input
    } else if (claimData.email) {
      userEmail = claimData.email
    } else if (claimData.user_email) {
      userEmail = claimData.user_email
    } else if (claimData.claimedBy && claimData.claimedBy.email) {
      userEmail = claimData.claimedBy.email
    } else if (claimData.user && claimData.user.email) {
      userEmail = claimData.user.email
    }

    // If we have either address or email, it's a successful claim
    if (userAddress || userEmail) {
      return {
        success: true,
        user_address: userAddress ? userAddress.toLowerCase() : undefined,
        user_ens: userEns,
        user_email: userEmail
      }
    } else {
      return {
        success: false,
        error: 'No user address or email found in claim data'
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getEnsName(address: string): Promise<string | null> {
  try {
    // Use a public ENS resolver service
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${address}`)

    if (!response.ok) {
      // Try alternative service
      const altResponse = await fetch(`https://api.web3.bio/profile/${address}`)
      if (altResponse.ok) {
        const altData = await altResponse.json()
        return altData.identity || altData.displayName || null
      }
      return null
    }

    const data = await response.json()
    return data.name || null

  } catch (error) {
    // Fallback: try a simple reverse lookup using public provider
    try {
      const fallbackResponse = await fetch(`https://api.web3.bio/profile/${address}`)
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        return fallbackData.identity || fallbackData.displayName || null
      }
    } catch (fallbackError) {
      // Silent fallback failure
    }

    return null
  }
}