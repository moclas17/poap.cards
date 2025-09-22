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
    return NextResponse.json(
      { error: 'Failed to fetch POAP metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function extractPoapHash(url: string): string | null {
  // POAP URLs can be in different formats:
  // https://poap.xyz/claim/abc123
  // http://POAP.xyz/mint/abc123
  // https://app.poap.xyz/claim/abc123
  // https://poap.delivery/abc123

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

async function fetchPoapMetadata(hash: string): Promise<PoapMetadata> {
  console.log('fetchPoapMetadata - Starting with hash:', hash)

  try {
    // Use scraping method (API auth has permission issues)
    console.log('fetchPoapMetadata - Using scraping method...')

    // Try to get better metadata from collectors page
    let claimResponse = await fetch(`https://collectors.poap.xyz/mint/${hash}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; POAP-Card-App/1.0)'
      }
    })

    if (!claimResponse.ok) {
      claimResponse = await fetch(`https://poap.xyz/mint/${hash}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; POAP-Card-App/1.0)'
        }
      })
    }

    if (claimResponse.ok) {
      const html = await claimResponse.text()

      // Extract metadata from HTML meta tags
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i)
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/i)
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)

      return {
        title: titleMatch?.[1] || 'POAP Event',
        description: descriptionMatch?.[1] || 'POAP Event Description',
        image: imageMatch?.[1] || '/placeholder-poap.png',
        event_id: 0
      }
    }

  } catch (error) {
    console.error('fetchPoapMetadata - Scraping failed:', error)
  }

  // Return default metadata if all methods fail
  console.log('fetchPoapMetadata - Returning default metadata')
  return {
    title: 'POAP Event',
    description: 'POAP Event Description',
    image: '/placeholder-poap.png',
    event_id: 0
  }
}