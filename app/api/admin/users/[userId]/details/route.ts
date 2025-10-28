import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{
    userId: string
  }>
}

/**
 * GET /api/admin/users/[userId]/details
 * Get detailed information about a user including their drops and cards
 * Admin only
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    await requireAdmin()

    const { userId } = await params

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, address, ens, is_admin, created_at')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's drops with code counts
    const { data: drops, error: dropsError } = await supabaseAdmin
      .from('drops')
      .select(`
        id,
        name,
        poap_event_id,
        created_at,
        poap_codes (
          id,
          is_used
        )
      `)
      .eq('owner_address', user.address)
      .order('created_at', { ascending: false })

    if (dropsError) {
      console.error('Error fetching user drops:', dropsError)
    }

    // Process drops to count codes
    const dropsWithCounts = (drops || []).map(drop => ({
      id: drop.id,
      name: drop.name,
      poap_event_id: drop.poap_event_id,
      created_at: drop.created_at,
      total_codes: drop.poap_codes?.length || 0,
      used_codes: drop.poap_codes?.filter((c: any) => c.is_used).length || 0,
      available_codes: drop.poap_codes?.filter((c: any) => !c.is_used).length || 0
    }))

    // Get user's cards with assignment info
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from('cards')
      .select(`
        id,
        ntag_uid,
        name,
        is_secure,
        is_assigned,
        created_at,
        card_drop_assignments (
          id,
          assigned_at,
          drops (
            id,
            name
          )
        )
      `)
      .eq('owner_address', user.address)
      .order('created_at', { ascending: false })

    if (cardsError) {
      console.error('Error fetching user cards:', cardsError)
    }

    // Process cards to flatten assignment info
    const cardsWithAssignments = (cards || []).map(card => {
      const assignment = Array.isArray(card.card_drop_assignments)
        ? card.card_drop_assignments[0]
        : null

      // Extract drop info safely
      const dropInfo: any = assignment?.drops
      const assignedDrop = dropInfo && !Array.isArray(dropInfo) && assignment ? {
        id: dropInfo.id,
        name: dropInfo.name,
        assigned_at: assignment.assigned_at
      } : null

      return {
        id: card.id,
        ntag_uid: card.ntag_uid,
        name: card.name,
        is_secure: card.is_secure,
        is_assigned: card.is_assigned,
        created_at: card.created_at,
        assigned_drop: assignedDrop
      }
    })

    // Get card read statistics
    const { data: cardReads, error: readsError } = await supabaseAdmin
      .from('card_reads')
      .select(`
        id,
        state,
        first_seen_at,
        cards!inner (
          owner_address
        )
      `)
      .eq('cards.owner_address', user.address)

    if (readsError) {
      console.error('Error fetching card reads:', readsError)
    }

    const totalTaps = cardReads?.length || 0
    const successfulClaims = cardReads?.filter(r => r.state === 'minted').length || 0

    return NextResponse.json({
      user,
      drops: dropsWithCounts,
      cards: cardsWithAssignments,
      stats: {
        total_drops: dropsWithCounts.length,
        total_cards: cardsWithAssignments.length,
        total_taps: totalTaps,
        successful_claims: successfulClaims
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.error('User details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
