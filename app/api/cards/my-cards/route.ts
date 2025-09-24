import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/require-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get user's cards from database
    // Note: 'name' field might not exist in older database versions
    const { data: cardsData, error } = await supabaseAdmin
      .from('cards')
      .select(`
        id,
        ntag_uid,
        name,
        is_secure,
        created_at
      `)
      .eq('owner_address', user.address)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Cards query error:', error)

      // If the error is about missing column 'name', try without it
      if (error.message?.includes('column "name"') || error.code === '42703') {
        console.log('Trying to query without name field for backward compatibility...')
        const { data: cardsDataRetry, error: retryError } = await supabaseAdmin
          .from('cards')
          .select(`
            id,
            ntag_uid,
            is_secure,
            created_at
          `)
          .eq('owner_address', user.address)
          .order('created_at', { ascending: false })

        if (retryError) {
          console.error('Retry cards query error:', retryError)
          return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
        }

        // Add default name for cards without names
        const cardsWithDefaultName = cardsDataRetry?.map(card => ({
          ...card,
          name: `Card ${card.ntag_uid.slice(-6)}`
        })) || []

        // Get assignment information separately
        const { data: assignments, error: assignmentError } = await supabaseAdmin
          .from('card_drop_assignments')
          .select('card_id')
          .in('card_id', cardsWithDefaultName?.map(card => card.id) || [])

        if (assignmentError) {
          console.error('Assignment query error:', assignmentError)
          return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
        }

        // Combine data to add is_assigned flag
        const assignedCardIds = new Set(assignments?.map(a => a.card_id) || [])
        const cards = cardsWithDefaultName?.map(card => ({
          ...card,
          is_assigned: assignedCardIds.has(card.id)
        })) || []

        return NextResponse.json(cards)
      }

      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
    }

    // Get assignment information separately
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('card_drop_assignments')
      .select('card_id')
      .in('card_id', cardsData?.map(card => card.id) || [])

    if (assignmentError) {
      console.error('Assignment query error:', assignmentError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Combine data to add is_assigned flag
    const assignedCardIds = new Set(assignments?.map(a => a.card_id) || [])
    const cards = cardsData?.map(card => ({
      ...card,
      is_assigned: assignedCardIds.has(card.id)
    })) || []

    return NextResponse.json(cards)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}