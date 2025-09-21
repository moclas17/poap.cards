import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Delegate to the API route for processing
  const url = new URL(request.url)
  const apiUrl = new URL('/api/r', url.origin)
  apiUrl.search = url.search

  try {
    const response = await fetch(apiUrl.toString())
    const data = await response.json()

    // If successfully served, redirect to claim URL
    if (data.status === 'served' && data.claimUrl) {
      return NextResponse.redirect(data.claimUrl)
    }

    // For other cases, show a user-friendly page or redirect to home
    if (data.status === 'minted') {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>POAP Already Claimed</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .emoji { font-size: 48px; margin-bottom: 20px; }
              h1 { color: #6E56CF; margin-bottom: 15px; }
              p { color: #666; line-height: 1.5; margin-bottom: 20px; }
              .btn { background: #6E56CF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="emoji">✅</div>
              <h1>POAP Already Claimed</h1>
              <p>This POAP has already been claimed by another wallet.</p>
              <a href="https://0xpo.app" class="btn">Visit POAP Card</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Handle error cases
    const errorMessages = {
      unclaimed_card: 'This card has not been claimed yet.',
      unassigned_drop: 'This card is not assigned to any POAP drop.',
      no_codes: 'No POAP codes available for this drop.',
      sdm_invalid: 'Invalid card signature. This may be a cloned card.',
      missing_sdm_params: 'Invalid card tap. Please try again.',
      database_error: 'Database error. Please try again later.',
      internal_error: 'Internal error. Please try again later.'
    }

    const message = errorMessages[data.reason as keyof typeof errorMessages] || 'Unknown error occurred.'

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POAP Card Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .emoji { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #dc2626; margin-bottom: 15px; }
            p { color: #666; line-height: 1.5; margin-bottom: 20px; }
            .btn { background: #6E56CF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">❌</div>
            <h1>Card Error</h1>
            <p>${message}</p>
            <a href="https://0xpo.app" class="btn">Visit POAP Card</a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Public tap route error:', error)

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>POAP Card Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .emoji { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #dc2626; margin-bottom: 15px; }
            p { color: #666; line-height: 1.5; margin-bottom: 20px; }
            .btn { background: #6E56CF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">⚠️</div>
            <h1>Service Error</h1>
            <p>Unable to process card tap. Please try again later.</p>
            <a href="https://0xpo.app" class="btn">Visit POAP Card</a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}