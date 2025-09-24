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

    // Get drop details
    const { data: drop, error } = await supabaseAdmin
      .from('drops')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('owner_address', user.address)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Drop not found' },
          { status: 404 }
        )
      }
      console.error('Drop query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch drop' },
        { status: 500 }
      )
    }

    return NextResponse.json(drop)

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Drop API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}