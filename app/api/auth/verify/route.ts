import { NextRequest, NextResponse } from 'next/server'
import { verifySiweSignature, createSiweMessage } from '@/lib/auth/siwe'
import { setAuthCookie } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveEnsName } from '@/lib/ens/resolve'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface VerifyRequest {
  message: string
  signature: string
  address: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, signature, address }: VerifyRequest = await request.json()

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the signature
    const isValid = await verifySiweSignature(
      message,
      signature as `0x${string}`,
      address
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const lowerAddress = address.toLowerCase()

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, ens')
      .eq('address', lowerAddress)
      .single()

    // Resolve ENS name if user is new or doesn't have ENS set
    let ensName: string | null = existingUser?.ens || null

    if (!existingUser || !ensName) {
      console.log(`Resolving ENS for ${lowerAddress}...`)
      ensName = await resolveEnsName(lowerAddress)
      if (ensName) {
        console.log(`ENS resolved: ${ensName}`)
      }
    }

    // Upsert user in database with ENS
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          address: lowerAddress,
          ens: ensName
        },
        { onConflict: 'address' }
      )

    if (upsertError) {
      console.error('User upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Set auth cookie
    await setAuthCookie(address)

    return NextResponse.json({
      success: true,
      address: address.toLowerCase()
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}