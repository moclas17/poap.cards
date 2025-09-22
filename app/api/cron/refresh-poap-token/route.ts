import { NextRequest, NextResponse } from 'next/server'
import { PoapAuth } from '@/lib/poap/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Basic security check - you might want to add a secret token
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const accessToken = await PoapAuth.getAccessToken()

    return NextResponse.json({
      success: true,
      message: 'POAP token refreshed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {

    return NextResponse.json(
      {
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Support both GET and POST for different cron services
  return GET(request)
}