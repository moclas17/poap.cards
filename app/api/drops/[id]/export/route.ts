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
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'csv'

    // Verify drop ownership
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('id, name')
      .eq('id', resolvedParams.id)
      .eq('owner_address', user.address)
      .single()

    if (dropError) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      )
    }

    // Get codes with claim details
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('poap_codes')
      .select(`
        id,
        claim_url,
        qr_hash,
        is_used,
        used_by_address,
        used_by_ens,
        used_at,
        created_at
      `)
      .eq('drop_id', resolvedParams.id)
      .order('created_at', { ascending: true })

    if (codesError) {
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      )
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Index', 'QR Hash', 'Claim URL', 'Status', 'Claimed By (ENS)', 'Claimed By (Address)', 'Claimed At', 'Created At']
      const csvRows = [headers.join(',')]

      codes?.forEach((code, index) => {
        const row = [
          index + 1,
          `"${code.qr_hash}"`,
          `"${code.claim_url}"`,
          code.is_used ? 'Claimed' : 'Available',
          code.used_by_ens ? `"${code.used_by_ens}"` : '',
          code.used_by_address ? `"${code.used_by_address}"` : '',
          code.used_at ? `"${new Date(code.used_at).toISOString()}"` : '',
          `"${new Date(code.created_at).toISOString()}"`
        ]
        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${drop.name || 'drop'}-codes.csv"`
        }
      })
    } else {
      // Generate JSON
      const jsonData = {
        drop: {
          id: drop.id,
          name: drop.name,
          exported_at: new Date().toISOString()
        },
        codes: codes?.map((code, index) => ({
          index: index + 1,
          qr_hash: code.qr_hash,
          claim_url: code.claim_url,
          status: code.is_used ? 'claimed' : 'available',
          claimed_by: code.used_by_address ? {
            ens_name: code.used_by_ens || null,
            wallet_address: code.used_by_address,
            display_name: code.used_by_ens || `${code.used_by_address.slice(0, 6)}...${code.used_by_address.slice(-4)}`
          } : null,
          claimed_at: code.used_at,
          created_at: code.created_at
        })) || []
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${drop.name || 'drop'}-codes.json"`
        }
      })
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}