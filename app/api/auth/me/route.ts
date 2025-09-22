import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    return NextResponse.json({
      isAuthenticated: true,
      address: user.address
    })
  } catch (error) {
    return NextResponse.json({
      isAuthenticated: false,
      address: null
    })
  }
}