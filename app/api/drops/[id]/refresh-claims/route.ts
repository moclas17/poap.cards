import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { PoapAuth } from '@/lib/poap/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const dropId = params.id

    // Verify the drop belongs to the user
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('*')
      .eq('id', dropId)
      .eq('owner_address', user.address.toLowerCase())
      .single()

    if (dropError || !drop) {
      return NextResponse.json(
        { error: 'Drop not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get all codes for this drop
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('poap_codes')
      .select('*')
      .eq('drop_id', dropId)

    if (codesError || !codes) {
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      )
    }

    console.log(`🔄 Refreshing claim status for ${codes.length} POAP codes...`)

    let updated = 0
    let newlyClaimed = 0
    let errors = 0

    // Check each code's status
    for (const code of codes) {
      try {
        const metadata = await PoapAuth.getPoapMetadata(code.qr_hash)

        // Prepare update data
        const updateData: any = {}
        let needsUpdate = false

        // Check if claim status changed
        if (metadata.claimed && !code.is_used) {
          updateData.is_used = true
          needsUpdate = true
          newlyClaimed++

          if (metadata.user_input) {
            updateData.used_by_email = metadata.user_input
          }
          if (metadata.claimed_date) {
            updateData.used_at = metadata.claimed_date
          }

          console.log(`  ✓ ${code.qr_hash}: Newly claimed ${metadata.user_input ? `by ${metadata.user_input}` : ''}`)
        } else if (!metadata.claimed && code.is_used) {
          // Code was marked as used but POAP says it's not claimed
          // This shouldn't happen, but we'll log it
          console.warn(`  ⚠ ${code.qr_hash}: Marked as used locally but not claimed in POAP`)
        }

        // Update if needed
        if (needsUpdate) {
          const { error: updateError } = await supabaseAdmin
            .from('poap_codes')
            .update(updateData)
            .eq('id', code.id)

          if (updateError) {
            console.error(`Failed to update ${code.qr_hash}:`, updateError)
            errors++
          } else {
            updated++
          }
        }
      } catch (error) {
        console.error(`Error checking ${code.qr_hash}:`, error)
        errors++
      }
    }

    console.log(`✅ Refresh complete: ${updated} updated, ${newlyClaimed} newly claimed, ${errors} errors`)

    return NextResponse.json({
      success: true,
      stats: {
        total: codes.length,
        updated,
        newlyClaimed,
        errors
      }
    })

  } catch (error) {
    console.error('Refresh claims API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
