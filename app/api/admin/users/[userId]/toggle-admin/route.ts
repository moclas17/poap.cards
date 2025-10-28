import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{
    userId: string
  }>
}

/**
 * POST /api/admin/users/[userId]/toggle-admin
 * Toggle admin status for a user
 * Admin only
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    const admin = await requireAdmin()

    const { userId } = await params
    const { isAdmin } = await request.json()

    // Validate input
    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isAdmin value' },
        { status: 400 }
      )
    }

    // Get the user to be modified
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('address, is_admin')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from demoting themselves
    if (targetUser.address.toLowerCase() === admin.address.toLowerCase() && !isAdmin) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin privileges' },
        { status: 400 }
      )
    }

    // Update user admin status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user admin status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user admin status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isAdmin ? 'User promoted to admin' : 'Admin privileges revoked'
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

    console.error('Toggle admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
