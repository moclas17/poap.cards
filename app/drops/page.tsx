'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { Header } from '@/components/layout/header'
import { DropStats } from '@/types/api'
import { NewDropForm } from '@/components/drops/new-drop-form'

export default function DropsPage() {
  const { address, isConnected } = useAppKitAccount()
  const [drops, setDrops] = useState<DropStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewDropForm, setShowNewDropForm] = useState(false)

  useEffect(() => {
    const autoAuthAndFetchDrops = async () => {
      if (!isConnected || !address) {
        setLoading(false)
        return
      }

      try {
        // Auto authenticate first
        const authResponse = await fetch('/api/auth/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })

        if (!authResponse.ok) {
          throw new Error('Auto authentication failed')
        }

        // Now fetch drops
        await fetchDrops()
      } catch (err) {
        console.error('Auto auth failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setLoading(false)
      }
    }

    autoAuthAndFetchDrops()
  }, [isConnected, address])

  const fetchDrops = async () => {
    try {
      const response = await fetch('/api/drops/me')
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in with your wallet to view your drops')
        } else {
          throw new Error('Failed to fetch drops')
        }
        return
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">My Drops</h1>
              <p className="text-gray-600">
                Manage your POAP drops and monitor distribution
              </p>
            </div>

            {isConnected && (
              <button
                onClick={() => setShowNewDropForm(true)}
                className="btn-primary"
              >
                + New Drop
              </button>
            )}
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
          ) : loading ? (
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
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-start gap-6">
                    {/* Desktop: Imagen */}
                    <div className="flex-shrink-0">
                      {drop.image_url && (
                        <img
                          src={drop.image_url}
                          alt={drop.name}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                      )}
                    </div>

                    {/* Desktop: Información del drop */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex-1 min-w-0 pr-4">
                          {drop.name}
                        </h3>
                        <a
                          href={`/drops/${drop.id}`}
                          className="btn-primary flex-shrink-0"
                        >
                          View Details
                        </a>
                      </div>

                      {drop.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {drop.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span>Total: {drop.total}</span>
                        <span>Used: {drop.used}</span>
                        <span>Available: {drop.free}</span>
                      </div>

                      {/* Progress bar */}
                      <div>
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
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    {/* Mobile: Header con imagen pequeña y título */}
                    <div className="flex items-start gap-3 mb-4">
                      {drop.image_url && (
                        <img
                          src={drop.image_url}
                          alt={drop.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {drop.name}
                        </h3>
                        {drop.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {drop.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Stats en grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-gray-800">{drop.total}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-600">{drop.free}</div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-blue-600">{drop.used}</div>
                        <div className="text-xs text-gray-600">Used</div>
                      </div>
                    </div>

                    {/* Mobile: Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
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

                    {/* Mobile: Botón centrado */}
                    <div className="text-center">
                      <a
                        href={`/drops/${drop.id}`}
                        className="btn-primary w-full"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <NewDropForm
        isOpen={showNewDropForm}
        onClose={() => setShowNewDropForm(false)}
        onSuccess={() => {
          fetchDrops()
          setShowNewDropForm(false)
        }}
      />
    </div>
  )
}