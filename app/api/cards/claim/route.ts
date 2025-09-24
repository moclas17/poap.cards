import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth/session'
import { ClaimCardRequest } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Debug logging removed

    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardUid: rawCardUid, cardName, originalUrl }: ClaimCardRequest & { cardName?: string; originalUrl?: string } = await request.json()

    if (!rawCardUid) {
      return NextResponse.json(
        { error: 'Card UID is required' },
        { status: 400 }
      )
    }

    if (!cardName?.trim()) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    // Clean the UID - remove X suffix for non-secure cards
    let cardUid = rawCardUid.trim()
    if (cardUid.includes('X')) {
      cardUid = cardUid.split('X')[0]
    } else if (cardUid.includes('x')) {
      cardUid = cardUid.split('x')[0]
    }
    cardUid = cardUid.toUpperCase()

    // Determine if card is secure based on the original input
    // If originalUrl is provided, use it; otherwise use cardUid for detection
    const inputToCheck = originalUrl || rawCardUid
    let isSecure = false

    try {
      // Check if input is a URL
      if (inputToCheck.includes('://')) {
        const url = new URL(inputToCheck)
        const params = url.searchParams

        // Secure: Has CMAC parameter (SDM with cryptographic verification)
        if (params.has('cmac')) {
          isSecure = true
        }
        // Not secure: Has 'x' separator or only UID parameter
        else if (inputToCheck.includes('x') || (params.has('uid') && !params.has('cmac'))) {
          isSecure = false
        }
      } else {
        // If it's just a UID string, check for 'x' separator
        isSecure = !inputToCheck.includes('x')
      }
    } catch (error) {
      // If URL parsing fails, assume it's a raw UID
      isSecure = !inputToCheck.includes('x')
    }

    // Upsert card (claim ownership)
    const cardData: any = {
      ntag_uid: cardUid,
      owner_address: user.address,
      is_secure: isSecure
    }

    // Only add name if provided (for backward compatibility)
    if (cardName?.trim()) {
      cardData.name = cardName.trim()
    }

    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .upsert(cardData, {
        onConflict: 'ntag_uid'
      })
      .select()
      .single()

    if (error) {
      console.error('Card claim error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // If the error is about missing column 'name', try without it
      if (error.message?.includes('column "name"') || error.message?.includes("'name' column") || error.code === '42703' || error.code === 'PGRST204') {
        console.log('Trying to upsert without name field for backward compatibility...')
        const { data: cardRetry, error: retryError } = await supabaseAdmin
          .from('cards')
          .upsert({
            ntag_uid: cardUid,
            owner_address: user.address,
            is_secure: isSecure
          }, {
            onConflict: 'ntag_uid'
          })
          .select()
          .single()

        if (retryError) {
          console.error('Retry error:', retryError)
          return NextResponse.json(
            { error: 'Failed to claim card - database schema mismatch' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          card: cardRetry,
          warning: 'Card claimed but name feature not available (database needs update)'
        })
      }

      return NextResponse.json(
        { error: 'Failed to claim card' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      card
    })

  } catch (error) {
    console.error('=== UNEXPECTED ERROR in Card Claim ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Full error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}