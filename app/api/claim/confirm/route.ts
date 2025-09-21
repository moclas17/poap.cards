import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ConfirmRequest {
  codeId: string
  claimer: string
}

// ENS resolution helper
async function resolveEns(address: string): Promise<string | null> {
  const rpcUrl = process.env.RPC_MAINNET
  if (!rpcUrl) return null

  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl)
    })

    const ensName = await client.getEnsName({
      address: address as `0x${string}`
    })

    return ensName
  } catch (error) {
    console.error('ENS resolution error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codeId, claimer }: ConfirmRequest = await request.json()

    if (!codeId || !claimer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(claimer)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    // Resolve ENS name
    const ensName = await resolveEns(claimer)

    // Update POAP code as used
    const { error: codeError } = await supabaseAdmin
      .from('poap_codes')
      .update({
        is_used: true,
        used_by_address: claimer.toLowerCase(),
        used_by_ens: ensName,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)

    if (codeError) {
      console.error('POAP code update error:', codeError)
      return NextResponse.json(
        { error: 'Failed to update POAP code' },
        { status: 500 }
      )
    }

    // Update card read state to 'minted'
    const { error: readError } = await supabaseAdmin
      .from('card_reads')
      .update({ state: 'minted' })
      .eq('poap_code_id', codeId)

    if (readError) {
      console.error('Card read update error:', readError)
      return NextResponse.json(
        { error: 'Failed to update card read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claimer: claimer.toLowerCase(),
      ensName
    })

  } catch (error) {
    console.error('Claim confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}