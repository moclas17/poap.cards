import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth/session'
import { ClaimCardRequest } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardUid }: ClaimCardRequest = await request.json()

    if (!cardUid) {
      return NextResponse.json(
        { error: 'Card UID is required' },
        { status: 400 }
      )
    }

    // Upsert card (claim ownership)
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .upsert({
        ntag_uid: cardUid,
        owner_address: user.address
      }, {
        onConflict: 'ntag_uid'
      })
      .select()
      .single()

    if (error) {
      console.error('Card claim error:', error)
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
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Card claim API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}