import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifySdm, parseSdmParams } from '@/lib/sdm/verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TapResponse {
  status: 'served' | 'minted' | 'error'
  claimUrl?: string
  codeId?: string
  reason?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse SDM parameters
    const sdmParams = parseSdmParams(searchParams)
    if (!sdmParams) {
      return NextResponse.json({
        status: 'error',
        reason: 'missing_sdm_params'
      } as TapResponse)
    }

    // Verify SDM
    const verification = verifySdm(sdmParams)
    if (!verification.isValid) {
      return NextResponse.json({
        status: 'error',
        reason: 'sdm_invalid'
      } as TapResponse)
    }

    // Check if card exists
    // Clean the UID in case it has X suffix
    let cleanUid = sdmParams.uid.trim()
    if (cleanUid.includes('X')) {
      cleanUid = cleanUid.split('X')[0]
    } else if (cleanUid.includes('x')) {
      cleanUid = cleanUid.split('x')[0]
    }
    cleanUid = cleanUid.toUpperCase()

    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('ntag_uid', cleanUid)
      .single()

    if (!card) {
      return NextResponse.json({
        status: 'error',
        reason: 'unclaimed_card'
      } as TapResponse)
    }

    // Check if card has drop assigned
    const { data: assignment } = await supabaseAdmin
      .from('card_drop_assignments')
      .select('drop_id')
      .eq('card_id', card.id)
      .single()

    if (!assignment) {
      return NextResponse.json({
        status: 'error',
        reason: 'unassigned_drop'
      } as TapResponse)
    }

    // Check for existing card read with this CMAC (idempotency)
    const { data: existingRead } = await supabaseAdmin
      .from('card_reads')
      .select('id, state, poap_code_id, poap_codes(claim_url)')
      .eq('sdm_cmac', sdmParams.cmac)
      .single()

    if (existingRead) {
      if (existingRead.state === 'minted') {
        return NextResponse.json({
          status: 'minted'
        } as TapResponse)
      }

      if (existingRead.state === 'served' && existingRead.poap_code_id) {
        const { data: code } = await supabaseAdmin
          .from('poap_codes')
          .select('claim_url')
          .eq('id', existingRead.poap_code_id)
          .single()

        return NextResponse.json({
          status: 'served',
          claimUrl: code?.claim_url,
          codeId: existingRead.poap_code_id
        } as TapResponse)
      }
    }

    // Reserve next available POAP code
    const { data: availableCode } = await supabaseAdmin
      .from('poap_codes')
      .select('id, claim_url')
      .eq('drop_id', assignment.drop_id)
      .eq('is_used', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!availableCode) {
      return NextResponse.json({
        status: 'error',
        reason: 'no_codes'
      } as TapResponse)
    }

    // Create or update card read record
    const { error: readError } = await supabaseAdmin
      .from('card_reads')
      .upsert({
        card_id: card.id,
        sdm_ctr: parseInt(sdmParams.ctr),
        sdm_cmac: sdmParams.cmac,
        poap_code_id: availableCode.id,
        state: 'served',
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'sdm_cmac'
      })

    if (readError) {
      console.error('Card read creation error:', readError)
      return NextResponse.json({
        status: 'error',
        reason: 'database_error'
      } as TapResponse)
    }

    return NextResponse.json({
      status: 'served',
      claimUrl: availableCode.claim_url,
      codeId: availableCode.id
    } as TapResponse)

  } catch (error) {
    console.error('NFC tap error:', error)
    return NextResponse.json({
      status: 'error',
      reason: 'internal_error'
    } as TapResponse, { status: 500 })
  }
}