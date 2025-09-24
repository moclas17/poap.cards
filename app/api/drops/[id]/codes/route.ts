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

    // First verify the drop belongs to the user
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('owner_address', user.address)
      .single()

    if (dropError) {
      if (dropError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Drop not found' },
          { status: 404 }
        )
      }
      console.error('Drop verification error:', dropError)
      return NextResponse.json(
        { error: 'Failed to verify drop ownership' },
        { status: 500 }
      )
    }

    // Get POAP codes with claim details
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('poap_codes')
      .select(`
        id,
        claim_url,
        qr_hash,
        is_used,
        used_by_address,
        used_by_ens,
        used_by_email,
        used_at,
        created_at
      `)
      .eq('drop_id', resolvedParams.id)
      .order('created_at', { ascending: true })

    if (codesError) {
      console.error('Codes query error:', codesError)
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      )
    }

    return NextResponse.json(codes || [])

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Codes API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}