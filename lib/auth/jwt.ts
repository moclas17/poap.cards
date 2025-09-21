import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'placeholder-jwt-secret-for-build'

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET environment variable is not set')
}

export interface JWTPayload {
  addr: string
  iat: number
  exp: number
}

export function signJWT(address: string): string {
  const payload = {
    addr: address.toLowerCase(),
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '12h',
  })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function setAuthCookie(address: string) {
  const token = signJWT(address)
  const cookieStore = await cookies()

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 12 * 60 * 60, // 12 hours in seconds
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value || null
}