import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const resolvedParams = await params
    const assignmentId = resolvedParams.id

    // First verify that the user owns the drop that this assignment belongs to
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('card_drop_assignments')
      .select(`
        id,
        card_id,
        drops!inner (
          id,
          owner_address
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if ((assignment.drops as any).owner_address !== user.address) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the assignment
    const { error: deleteError } = await supabaseAdmin
      .from('card_drop_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Delete assignment error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
      )
    }

    // Update the is_assigned flag in the cards table
    const { error: updateError } = await supabaseAdmin
      .from('cards')
      .update({ is_assigned: false })
      .eq('id', assignment.card_id)

    if (updateError) {
      console.error('Card update error:', updateError)
      // Assignment was deleted but is_assigned flag could not be updated
      console.error('Assignment was deleted but is_assigned flag could not be updated')
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Delete assignment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}