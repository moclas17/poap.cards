import { NextRequest, NextResponse } from 'next/server'
import { verifySiweSignature, createSiweMessage } from '@/lib/auth/siwe'
import { setAuthCookie } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    // Upsert user in database
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        { address: address.toLowerCase() },
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