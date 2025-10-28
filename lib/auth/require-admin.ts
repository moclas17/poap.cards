import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth, AuthUser } from './require-auth'

export interface AdminUser extends AuthUser {
  isAdmin: true
}

/**
 * Middleware to require admin authentication
 * Throws error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  // First, ensure user is authenticated
  const user = await requireAuth()

  // Check if user is admin in database
  const { data: dbUser, error } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('address', user.address)
    .single()

  if (error || !dbUser) {
    throw new Error('Forbidden: User not found')
  }

  if (!dbUser.is_admin) {
    throw new Error('Forbidden: Admin access required')
  }

  return {
    ...user,
    isAdmin: true
  }
}

/**
 * Check if a user is admin without throwing
 * Returns true if admin, false otherwise
 */
export async function isUserAdmin(address: string): Promise<boolean> {
  const { data: dbUser, error } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('address', address)
    .single()

  if (error || !dbUser) {
    return false
  }

  return dbUser.is_admin === true
}
