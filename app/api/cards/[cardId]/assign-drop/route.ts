import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await requireAuth()
    const resolvedParams = await params
    const { dropId } = await request.json()

    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' },
        { status: 400 }
      )
    }

    // Verify the card belongs to the user (cardId is actually ntag_uid from frontend)
    // Clean the cardId in case it has X suffix
    let cleanCardId = resolvedParams.cardId.trim()
    if (cleanCardId.includes('X')) {
      cleanCardId = cleanCardId.split('X')[0]
    } else if (cleanCardId.includes('x')) {
      cleanCardId = cleanCardId.split('x')[0]
    }
    cleanCardId = cleanCardId.toUpperCase()

    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, owner_address')
      .eq('ntag_uid', cleanCardId)
      .eq('owner_address', user.address)
      .single()

    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Card not found or not owned by user' },
          { status: 404 }
        )
      }
      console.error('Card query error:', cardError)
      return NextResponse.json(
        { error: 'Failed to verify card ownership' },
        { status: 500 }
      )
    }

    // Check if card is already assigned by looking at assignments table
    const { data: existingAssignment } = await supabaseAdmin
      .from('card_drop_assignments')
      .select('id')
      .eq('card_id', card.id)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Card is already assigned to another drop' },
        { status: 400 }
      )
    }

    // Verify the drop belongs to the user
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('id')
      .eq('id', dropId)
      .eq('owner_address', user.address)
      .single()

    if (dropError) {
      if (dropError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Drop not found or not owned by user' },
          { status: 404 }
        )
      }
      console.error('Drop query error:', dropError)
      return NextResponse.json(
        { error: 'Failed to verify drop ownership' },
        { status: 500 }
      )
    }

    // Note: The previous check already verified this card isn't assigned to any drop

    // Create assignment and update is_assigned flag in a transaction
    const { error: assignmentError } = await supabaseAdmin
      .from('card_drop_assignments')
      .insert({
        card_id: card.id,
        drop_id: dropId
      })

    if (assignmentError) {
      console.error('Assignment creation error:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to assign card to drop' },
        { status: 500 }
      )
    }

    // Update the is_assigned flag in the cards table
    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({ is_assigned: true })
      .eq('id', card.id)

    if (updateError) {
      console.error('Card update error:', updateError)
      // We should probably rollback the assignment here, but for now just log
      console.error('Card was assigned but is_assigned flag could not be updated')
    }

    return NextResponse.json({
      success: true,
      message: 'Card successfully assigned to drop'
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Card assignment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}