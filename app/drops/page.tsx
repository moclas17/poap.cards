'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/layout/header'
import { DropStats } from '@/types/api'
import { useAuth } from '@/lib/auth/use-auth'

export default function DropsPage() {
  const { isConnected } = useAccount()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [drops, setDrops] = useState<DropStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Drops page effect - isConnected:', isConnected, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading)

    if (isAuthenticated && !authLoading) {
      console.log('✅ Connected and authenticated, fetching drops...')
      fetchDrops()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [isConnected, isAuthenticated, authLoading])

  const fetchDrops = async () => {
    try {
      const response = await fetch('/api/drops/me')
      if (!response.ok) {
        throw new Error('Failed to fetch drops')
      }
      const data = await response.json()
      setDrops(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">My Drops</h1>
            <p className="text-gray-600">
              Manage your POAP drops and monitor distribution
            </p>
          </div>

          {!isConnected ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to view your POAP drops.
              </p>
            </div>
          ) : !isAuthenticated && !authLoading ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please sign the authentication message to access your POAP drops.
              </p>
            </div>
          ) : loading || authLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading drops...</p>
            </div>
          ) : error ? (
            <div className="card text-center py-12">
              <div className="text-red-600 text-lg font-medium mb-2">
                Error Loading Drops
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchDrops}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : drops.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Drops Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t created any POAP drops yet. Contact support to create your first drop.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drops.map((drop) => (
                <div key={drop.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {drop.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Total: {drop.total}</span>
                        <span>Used: {drop.used}</span>
                        <span>Available: {drop.free}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {drop.free}
                        </div>
                        <div className="text-xs text-gray-500">available</div>
                      </div>

                      <a
                        href={`/drops/${drop.id}`}
                        className="btn-primary"
                      >
                        View Details
                      </a>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Distribution Progress</span>
                      <span>{drop.total > 0 ? Math.round((drop.used / drop.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: drop.total > 0 ? `${(drop.used / drop.total) * 100}%` : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}