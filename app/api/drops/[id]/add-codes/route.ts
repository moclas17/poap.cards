import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Starting add codes to drop...')
    const user = await requireAuth()
    const resolvedParams = await params
    console.log('🔍 User authenticated:', user.address)

    // Verify drop ownership
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('id, owner_address, total_codes, poap_event_id')
      .eq('id', resolvedParams.id)
      .eq('owner_address', user.address.toLowerCase())
      .single()

    if (dropError) {
      if (dropError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Drop not found or unauthorized' },
          { status: 404 }
        )
      }
      console.error('Drop verification error:', dropError)
      return NextResponse.json(
        { error: 'Failed to verify drop ownership' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('🔍 Form data received:', {
      hasFile: !!file
    })

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      )
    }

    // Read and process file
    const text = await file.text()
    const lines = text.split('\n').map(line => line.trim())

    // Look for URLs containing POAP-related domains
    const urls = lines.filter(line => {
      return (line.includes('http://') || line.includes('https://')) && (
        line.toLowerCase().includes('poap.xyz') ||
        line.toLowerCase().includes('app.poap.xyz') ||
        line.toLowerCase().includes('poap.delivery') ||
        line.toLowerCase().includes('poap.tech')
      )
    })

    console.log('🔍 Found URLs:', urls.length)

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No valid POAP URLs found in file' },
        { status: 400 }
      )
    }

    // Check for duplicate URLs in existing codes
    const existingHashes = new Set<string>()
    const { data: existingCodes } = await supabaseAdmin
      .from('poap_codes')
      .select('qr_hash')
      .eq('drop_id', resolvedParams.id)

    if (existingCodes) {
      existingCodes.forEach(code => existingHashes.add(code.qr_hash))
    }

    // Filter out duplicates
    const newUrls = urls.filter(url => {
      const hash = extractPoapHash(url)
      return hash && !existingHashes.has(hash)
    })

    console.log('🔍 New unique URLs:', newUrls.length, '(filtered out', urls.length - newUrls.length, 'duplicates)')

    if (newUrls.length === 0) {
      return NextResponse.json(
        { error: 'All URLs are already in the drop' },
        { status: 400 }
      )
    }

    // Check claim status for each new code
    console.log('🔍 Checking claim status for all new POAP codes...')
    const { PoapAuth } = await import('@/lib/poap/auth')

    const poapCodes = await Promise.all(
      newUrls.map(async (url) => {
        const hash = extractPoapHash(url) || crypto.randomUUID()

        // Check claim status from POAP API
        let claimData = null
        try {
          const metadata = await PoapAuth.getPoapMetadata(hash)
          claimData = metadata
        } catch (error) {
          console.warn(`Could not fetch claim status for ${hash}:`, error)
        }

        // Build the code object with claim status
        const code: any = {
          drop_id: drop.id,
          claim_url: url,
          qr_hash: hash,
          is_used: claimData?.claimed === true,
        }

        // If claimed, add the claim details
        if (claimData?.claimed) {
          if (claimData.user_input) {
            code.used_by_email = claimData.user_input
          }
          if (claimData.claimed_date) {
            code.used_at = claimData.claimed_date
          }
          console.log(`  ✓ ${hash}: Already claimed ${claimData.user_input ? `by ${claimData.user_input}` : ''}`)
        } else {
          console.log(`  ○ ${hash}: Available`)
        }

        return code
      })
    )

    console.log('🔍 Claim status check complete. Inserting codes...')

    const { error: codesError } = await supabaseAdmin
      .from('poap_codes')
      .insert(poapCodes)

    if (codesError) {
      console.error('POAP codes creation error:', codesError)
      return NextResponse.json(
        { error: 'Failed to add POAP codes' },
        { status: 500 }
      )
    }

    // Update total_codes in drop
    const newTotalCodes = drop.total_codes + poapCodes.length
    await supabaseAdmin
      .from('drops')
      .update({ total_codes: newTotalCodes })
      .eq('id', drop.id)

    // Calculate stats
    const alreadyClaimed = poapCodes.filter(c => c.is_used).length
    const available = poapCodes.length - alreadyClaimed

    console.log(`✅ Codes added: ${poapCodes.length} total, ${available} available, ${alreadyClaimed} already claimed`)

    return NextResponse.json({
      success: true,
      added: poapCodes.length,
      available,
      claimed: alreadyClaimed,
      duplicatesSkipped: urls.length - newUrls.length
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Add codes API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function extractPoapHash(url: string): string | null {
  // Toma los últimos 6 caracteres de la URL
  const trimmedUrl = url.trim()
  const qrHash = trimmedUrl.slice(-6)

  // Validar que contiene solo caracteres alfanuméricos
  if (/^[a-zA-Z0-9]{6}$/.test(qrHash)) {
    return qrHash
  }

  return null
}
