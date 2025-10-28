import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { isUserAdmin } from '@/lib/auth/require-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const isAdmin = await isUserAdmin(user.address)

    return NextResponse.json({
      isAuthenticated: true,
      address: user.address,
      isAdmin
    })
  } catch (error) {
    return NextResponse.json({
      isAuthenticated: false,
      address: null,
      isAdmin: false
    })
  }
}