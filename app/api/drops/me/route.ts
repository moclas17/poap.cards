import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { DropStats } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get drops with code statistics
    const { data: drops, error } = await supabaseAdmin
      .from('drops')
      .select(`
        id,
        name,
        description,
        image_url,
        poap_codes (
          id,
          is_used
        )
      `)
      .eq('owner_address', user.address)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Drops query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch drops' },
        { status: 500 }
      )
    }

    // Transform data to include statistics
    const dropsWithStats: DropStats[] = drops.map(drop => {
      const total = drop.poap_codes?.length || 0
      const used = drop.poap_codes?.filter(code => code.is_used).length || 0
      const free = total - used

      return {
        id: drop.id,
        name: drop.name,
        description: drop.description,
        image_url: drop.image_url,
        total,
        used,
        free
      }
    })

    return NextResponse.json(dropsWithStats)

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Drops API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}