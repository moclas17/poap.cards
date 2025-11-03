import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting drop creation...')
    const user = await requireAuth()
    console.log('🔍 User authenticated:', user.address)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const image = formData.get('image') as string

    console.log('🔍 Form data received:', {
      hasFile: !!file,
      title,
      description: description?.substring(0, 50) + '...',
      image: image?.substring(0, 50) + '...'
    })

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Read and process file
    const text = await file.text()
    const lines = text.split('\n').map(line => line.trim())

    // Look for URLs containing POAP-related domains (support both http and https)
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

    // Extract POAP event ID from first URL using API
    let poapEventId = null
    const firstUrl = urls[0]
    try {
      const hash = extractPoapHash(firstUrl)
      if (hash) {
        // Get event_id from POAP API
        const { PoapAuth } = await import('@/lib/poap/auth')
        const metadata = await PoapAuth.getPoapMetadata(hash)
        poapEventId = metadata.event?.id || null
        console.log('🔍 Extracted event_id:', poapEventId)
      }
    } catch (error) {
      console.log('Could not extract POAP event ID:', error)
    }

    // Start transaction
    console.log('🔍 Creating drop with data:', {
      name: title,
      description: description?.substring(0, 50) + '...',
      image_url: image?.substring(0, 50) + '...',
      poap_event_id: poapEventId,
      owner_address: user.address.toLowerCase(),
      total_codes: urls.length
    })

    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .insert({
        name: title,
        description: description,
        image_url: image,
        poap_event_id: poapEventId,
        owner_address: user.address.toLowerCase(),
        total_codes: urls.length
      })
      .select()
      .single()

    if (dropError) {
      console.error('Drop creation error:', dropError)
      return NextResponse.json(
        { error: 'Failed to create drop', details: dropError.message },
        { status: 500 }
      )
    }

    // Create POAP codes and check claim status for each
    console.log('🔍 Checking claim status for all POAP codes...')
    const { PoapAuth } = await import('@/lib/poap/auth')

    const poapCodes = await Promise.all(
      urls.map(async (url) => {
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

      // Rollback: delete the drop
      await supabaseAdmin
        .from('drops')
        .delete()
        .eq('id', drop.id)

      return NextResponse.json(
        { error: 'Failed to create POAP codes' },
        { status: 500 }
      )
    }

    // Calculate stats
    const alreadyClaimed = poapCodes.filter(c => c.is_used).length
    const available = poapCodes.length - alreadyClaimed

    console.log(`✅ Drop created: ${poapCodes.length} total, ${available} available, ${alreadyClaimed} already claimed`)

    return NextResponse.json({
      success: true,
      drop: {
        id: drop.id,
        name: drop.name,
        description: drop.description,
        total_codes: urls.length,
        available_codes: available,
        claimed_codes: alreadyClaimed
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Create drop API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function extractPoapHash(url: string): string | null {
  // Igual que en PHP: $qr_hash=substr(trim($link), -6);
  // Toma los últimos 6 caracteres de la URL
  const trimmedUrl = url.trim()
  const qrHash = trimmedUrl.slice(-6)

  // Validar que contiene solo caracteres alfanuméricos
  if (/^[a-zA-Z0-9]{6}$/.test(qrHash)) {
    return qrHash
  }

  return null
}