'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/auth/use-auth'

interface User {
  id: string
  address: string
  ens: string | null
  is_admin: boolean
  created_at: string
}

interface Drop {
  id: string
  name: string
  poap_event_id: number | null
  created_at: string
  total_codes: number
  used_codes: number
  available_codes: number
}

interface Card {
  id: string
  ntag_uid: string
  name: string
  is_secure: boolean
  is_assigned: boolean
  created_at: string
  assigned_drop: {
    id: string
    name: string
    assigned_at: string
  } | null
}

interface UserDetails {
  user: User
  drops: Drop[]
  cards: Card[]
  stats: {
    total_drops: number
    total_cards: number
    total_taps: number
    successful_claims: number
  }
}

export default function AdminPage() {
  const { isConnected, address } = useAppKitAccount()
  const { isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!isAuthenticated) return

      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        }
      } catch (err) {
        console.error('Failed to check admin status:', err)
      }
    }

    checkAdminStatus()
  }, [isAuthenticated])

  // Load users when admin is confirmed
  const loadUsers = async () => {
    if (!isAdmin) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have admin access')
        }
        throw new Error('Failed to load users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [isAdmin])

  // Load user details when expanding
  const loadUserDetails = async (userId: string) => {
    setDetailsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/details`)
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data)
      }
    } catch (err) {
      console.error('Failed to load user details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  // Toggle user expansion
  const handleUserClick = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      setUserDetails(null)
    } else {
      setExpandedUserId(userId)
      loadUserDetails(userId)
    }
  }

  // Toggle admin status
  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const confirmMessage = newStatus
      ? 'Are you sure you want to promote this user to admin?'
      : 'Are you sure you want to revoke admin privileges from this user?'

    if (!confirm(confirmMessage)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: newStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin status')
      }

      // Reload users list
      await loadUsers()

      // Update userDetails if currently viewing this user
      if (expandedUserId === userId && userDetails) {
        setUserDetails({
          ...userDetails,
          user: {
            ...userDetails.user,
            is_admin: newStatus
          }
        })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setActionLoading(null)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Admin Panel</h1>
            <p className="text-gray-600">
              Manage users and view system statistics
            </p>
          </div>

          {!isConnected ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to access the admin panel.
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please sign in to access the admin panel.
              </p>
            </div>
          ) : !isAdmin ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 mb-6">
                You do not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500">
                Admin access is required to view this content.
              </p>
            </div>
          ) : (
            <>
              {/* Users List */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Registered Users</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-semibold text-gray-800">{users.length}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Admins: <span className="font-semibold text-primary">{users.filter(u => u.is_admin).length}</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {error}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-600">No users registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* User Row */}
                        <div
                          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleUserClick(user.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Expand Icon */}
                            <div className="text-gray-400">
                              {expandedUserId === user.id ? '▼' : '▶'}
                            </div>

                            {/* Address */}
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-gray-800">
                                {formatAddress(user.address)}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(user.address)
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                title="Copy full address"
                              >
                                Copy
                              </button>
                            </div>

                            {/* ENS */}
                            <div className="text-sm text-gray-600">
                              {user.ens ? (
                                <span className="text-blue-600 font-medium">{user.ens}</span>
                              ) : (
                                <span className="text-gray-400 italic">No ENS</span>
                              )}
                            </div>

                            {/* Role Badge */}
                            <div>
                              {user.is_admin ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <span>👑</span>
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  User
                                </span>
                              )}
                            </div>

                            {/* Join Date */}
                            <div className="text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </div>
                          </div>

                          {/* Toggle Admin Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleAdmin(user.id, user.is_admin)
                            }}
                            disabled={
                              actionLoading === user.id ||
                              user.address.toLowerCase() === address?.toLowerCase()
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              user.is_admin
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {actionLoading === user.id ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                Loading...
                              </span>
                            ) : user.is_admin ? (
                              'Revoke Admin'
                            ) : (
                              'Make Admin'
                            )}
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {expandedUserId === user.id && (
                          <div className="border-t border-gray-200 bg-gray-50 p-6">
                            {detailsLoading ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                                <p className="text-sm text-gray-600">Loading user details...</p>
                              </div>
                            ) : userDetails ? (
                              <div className="space-y-6">
                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {userDetails.stats.total_drops}
                                    </div>
                                    <div className="text-sm text-gray-600">Drops Created</div>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-2xl font-bold text-blue-600">
                                      {userDetails.stats.total_cards}
                                    </div>
                                    <div className="text-sm text-gray-600">Cards Owned</div>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-2xl font-bold text-green-600">
                                      {userDetails.stats.total_taps}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Taps</div>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="text-2xl font-bold text-amber-600">
                                      {userDetails.stats.successful_claims}
                                    </div>
                                    <div className="text-sm text-gray-600">POAPs Claimed</div>
                                  </div>
                                </div>

                                {/* Drops */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span>📦</span>
                                    Drops ({userDetails.drops.length})
                                  </h3>
                                  {userDetails.drops.length === 0 ? (
                                    <div className="bg-white rounded-lg p-6 border border-gray-200 text-center text-gray-500">
                                      No drops created yet
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {userDetails.drops.map((drop) => (
                                        <div
                                          key={drop.id}
                                          className="bg-white rounded-lg p-4 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-800">
                                                {drop.name}
                                              </div>
                                              <div className="text-sm text-gray-500 mt-1">
                                                POAP Event ID: {drop.poap_event_id || 'N/A'}
                                              </div>
                                              <div className="text-xs text-gray-400 mt-1">
                                                Created {formatDate(drop.created_at)}
                                              </div>
                                            </div>
                                            <div className="flex gap-3 text-sm">
                                              <div className="text-center">
                                                <div className="font-semibold text-gray-800">
                                                  {drop.total_codes}
                                                </div>
                                                <div className="text-xs text-gray-500">Total</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-semibold text-green-600">
                                                  {drop.available_codes}
                                                </div>
                                                <div className="text-xs text-gray-500">Available</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="font-semibold text-red-600">
                                                  {drop.used_codes}
                                                </div>
                                                <div className="text-xs text-gray-500">Used</div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Cards */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <span>📱</span>
                                    Cards ({userDetails.cards.length})
                                  </h3>
                                  {userDetails.cards.length === 0 ? (
                                    <div className="bg-white rounded-lg p-6 border border-gray-200 text-center text-gray-500">
                                      No cards owned yet
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {userDetails.cards.map((card) => (
                                        <div
                                          key={card.id}
                                          className="bg-white rounded-lg p-4 border border-gray-200"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="font-medium text-gray-800">
                                                  {card.name}
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                  card.is_secure
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {card.is_secure ? '🔒 Secure' : '⚠️ Basic'}
                                                </div>
                                              </div>
                                              <div className="text-sm text-gray-600 font-mono">
                                                UID: {card.ntag_uid}
                                              </div>
                                              <div className="text-xs text-gray-400 mt-1">
                                                Added {formatDate(card.created_at)}
                                              </div>
                                              {card.assigned_drop && (
                                                <div className="mt-2 text-sm">
                                                  <span className="text-gray-600">Assigned to: </span>
                                                  <span className="font-medium text-purple-600">
                                                    {card.assigned_drop.name}
                                                  </span>
                                                  <span className="text-gray-400 text-xs ml-2">
                                                    ({formatDate(card.assigned_drop.assigned_at)})
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {card.is_assigned ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                  Assigned
                                                </span>
                                              ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                  Unassigned
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                Failed to load user details
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
