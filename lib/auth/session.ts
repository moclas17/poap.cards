import { NextRequest } from 'next/server'

// Simple session management - just check if user is connected via headers
export async function getSessionUser(request: NextRequest) {
  // For now, we'll use a simple approach since we removed SIWE
  // In production, you might want to implement proper session management

  // Get the user's address from a custom header (set by the frontend)
  const address = request.headers.get('x-wallet-address')

  if (!address) {
    return null
  }

  return {
    address: address.toLowerCase()
  }
}