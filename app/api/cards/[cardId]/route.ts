import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth/session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

    // First check if the card belongs to the user
    const { data: card, error: fetchError } = await supabaseAdmin
      .from('cards')
      .select('id, owner_address')
      .eq('id', cardId)
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (card.owner_address !== user.address) {
      return NextResponse.json({ error: 'Unauthorized - not your card' }, { status: 403 })
    }

    // Delete the card
    const { error: deleteError } = await supabaseAdmin
      .from('cards')
      .delete()
      .eq('id', cardId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}