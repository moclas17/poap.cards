import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PoapMetadata {
  title: string
  description: string
  image: string
  event_id: number
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Check if URL contains POAP domains (case insensitive)
    const lowerUrl = url.toLowerCase()
    if (!lowerUrl.includes('poap.xyz') && !lowerUrl.includes('poap.tech') && !lowerUrl.includes('poap.delivery')) {
      return NextResponse.json(
        { error: 'Invalid POAP URL - must contain poap.xyz, poap.tech, or poap.delivery' },
        { status: 400 }
      )
    }

    // Extract POAP hash from URL
    const poapHash = extractPoapHash(url)

    if (!poapHash) {
      return NextResponse.json(
        { error: 'Could not extract POAP hash from URL' },
        { status: 400 }
      )
    }

    // Fetch POAP metadata
    const metadata = await fetchPoapMetadata(poapHash)

    return NextResponse.json(metadata)

  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch POAP metadata', details: error instanceof Error ? error.message : 'Unknown error' },
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

async function fetchPoapMetadata(hash: string): Promise<PoapMetadata> {
  const { PoapAuth } = await import('@/lib/poap/auth')

  try {
    console.log('Fetching POAP metadata for hash:', hash)
    const dataEvento = await PoapAuth.getPoapMetadata(hash)
    console.log('POAP API response:', dataEvento)

    // Estructura similar al PHP: $dataEvento['event']['id']
    const evento = dataEvento.event

    if (!evento) {
      console.error('No event data in POAP response:', dataEvento)
      throw new Error('Invalid POAP response - no event data')
    }

    return {
      title: evento?.name || 'POAP Event',
      description: evento?.description || 'POAP Event Description',
      image: evento?.image_url || '/placeholder-poap.png',
      event_id: evento?.id || 0
    }
  } catch (error) {
    console.error('fetchPoapMetadata error:', error)
    throw new Error(`Failed to fetch POAP metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}