import { NextRequest } from 'next/server'
import { getAuthCookie, verifyJWT, JWTPayload } from './jwt'

export interface AuthUser {
  address: string
}

export async function requireAuth(): Promise<AuthUser> {
  const token = await getAuthCookie()

  if (!token) {
    throw new Error('Unauthorized: No auth token')
  }

  const payload = verifyJWT(token)

  if (!payload) {
    throw new Error('Unauthorized: Invalid token')
  }

  return {
    address: payload.addr
  }
}

export function requireAuthFromRequest(request: NextRequest): AuthUser {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    throw new Error('Unauthorized: No auth token')
  }

  const payload = verifyJWT(token)

  if (!payload) {
    throw new Error('Unauthorized: Invalid token')
  }

  return {
    address: payload.addr
  }
}