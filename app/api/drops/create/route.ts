import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const image = formData.get('image') as string

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

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No valid POAP URLs found in file' },
        { status: 400 }
      )
    }

    // Extract POAP event ID from first URL if possible
    let poapEventId = null
    const firstUrl = urls[0]
    try {
      // Try to extract event ID from URL or hash
      const hash = extractPoapHash(firstUrl)
      if (hash) {
        // You could fetch event ID from POAP API here if needed
        poapEventId = hash
      }
    } catch (error) {
      console.log('Could not extract POAP event ID:', error)
    }

    // Start transaction
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
        { error: 'Failed to create drop' },
        { status: 500 }
      )
    }

    // Create POAP codes
    const poapCodes = urls.map(url => {
      const hash = extractPoapHash(url) || crypto.randomUUID()
      return {
        drop_id: drop.id,
        claim_url: url,
        qr_hash: hash,
        is_used: false
      }
    })

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

    return NextResponse.json({
      success: true,
      drop: {
        id: drop.id,
        name: drop.name,
        description: drop.description,
        total_codes: urls.length
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function extractPoapHash(url: string): string | null {
  const patterns = [
    /poap\.xyz\/claim\/([a-zA-Z0-9]+)/i,
    /poap\.xyz\/mint\/([a-zA-Z0-9]+)/i,
    /app\.poap\.xyz\/claim\/([a-zA-Z0-9]+)/i,
    /app\.poap\.xyz\/mint\/([a-zA-Z0-9]+)/i,
    /poap\.delivery\/([a-zA-Z0-9]+)/i
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}