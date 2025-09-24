import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AutoAuthRequest {
  address: string
}

export async function POST(request: NextRequest) {
  try {
    const { address }: AutoAuthRequest = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Basic validation - ensure it's a valid Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Upsert user in database
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        { address: normalizedAddress },
        { onConflict: 'address' }
      )

    if (upsertError) {
      console.error('User upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Set auth cookie automatically
    await setAuthCookie(normalizedAddress)

    return NextResponse.json({
      success: true,
      address: normalizedAddress
    })
  } catch (error) {
    console.error('Auto auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}