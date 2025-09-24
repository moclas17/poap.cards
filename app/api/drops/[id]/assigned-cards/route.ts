import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const resolvedParams = await params

    // Verify drop ownership
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('owner_address', user.address)
      .single()

    if (dropError) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      )
    }

    // Get assigned cards for this drop
    const { data: assignedCards, error: cardsError } = await supabaseAdmin
      .from('card_drop_assignments')
      .select(`
        id,
        assigned_at,
        cards (
          id,
          ntag_uid,
          name,
          owner_address
        )
      `)
      .eq('drop_id', resolvedParams.id)

    if (cardsError) {
      console.error('Assigned cards query error:', cardsError)
      return NextResponse.json(
        { error: 'Failed to fetch assigned cards' },
        { status: 500 }
      )
    }

    // Transform the data to match the Card interface
    const cards = assignedCards?.map((assignment: any) => ({
      id: assignment.cards.id,
      ntag_uid: assignment.cards.ntag_uid,
      name: assignment.cards.name,
      is_assigned: true, // All cards in this query are assigned
      assignment_id: assignment.id,
      assigned_at: assignment.assigned_at
    })) || []

    return NextResponse.json(cards)

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Assigned cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}