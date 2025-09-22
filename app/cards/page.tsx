'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/auth/use-auth'

interface Card {
  id: string
  ntag_uid: string
  created_at: string
}

declare global {
  interface Navigator {
    nfc?: {
      scan: (options?: { signal?: AbortSignal }) => Promise<void>
    }
  }
}

export default function CardsPage() {
  const { isConnected, address } = useAccount()
  const { isAuthenticated } = useAuth()
  const [cardUid, setCardUid] = useState('')
  const [loading, setLoading] = useState(false)
  const [nfcLoading, setNfcLoading] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isChromeAndroid, setIsChromeAndroid] = useState(false)

  // Detect Chrome Android
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isAndroid = /Android/.test(userAgent)
    const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent)
    setIsChromeAndroid(isAndroid && isChrome)
  }, [])

  // Load user's cards when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCards()
    }
  }, [isAuthenticated, loadCards])

  const loadCards = useCallback(async () => {
    if (!address) return

    try {
      const response = await fetch('/api/cards/my-cards', {
        headers: {
          'x-wallet-address': address
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCards(data)
      }
    } catch (error) {
      console.error('Failed to load cards:', error)
    }
  }, [address])

  const handleNfcRead = async () => {
    console.log('User clicked scan button')

    setNfcLoading(true)
    setMessage(null)

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader();

      await ndef.scan()
      console.log('> Scan started')

      ndef.addEventListener("readingerror", () => {
        console.log('Argh! Cannot read data from the NFC tag. Try another one?')
        setMessage({ type: 'error', text: 'Cannot read data from the NFC tag. Try another one?' })
        setNfcLoading(false)
      })

      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        console.log(`> Serial Number: ${serialNumber}`)
        console.log(`> Records: (${message.records.length})`)

        let extractedUid = null

        // Try to extract UID from NFC records first
        if (message.records && message.records.length > 0) {
          for (const record of message.records) {
            try {
              if (record.recordType === 'url') {
                const url = new TextDecoder().decode(record.data)
                console.log('Found URL record:', url)

                // Extract UID from URL like: https://card.0xpo.app/?uid=048040627E7580&ctr=00000A&cmac=7DD11A6791B72AEC
                const urlObj = new URL(url)
                const uidParam = urlObj.searchParams.get('uid')
                if (uidParam) {
                  extractedUid = uidParam.toUpperCase()
                  console.log('Extracted UID from URL:', extractedUid)
                  break
                }
              }
            } catch (error) {
              console.log('Error parsing record:', error)
            }
          }
        }

        // Fallback to serial number if no UID found in records
        if (!extractedUid && serialNumber) {
          extractedUid = serialNumber.replace(/:/g, '').toUpperCase()
          console.log('Using serial number as UID:', extractedUid)
        }

        if (extractedUid) {
          // Show the full URL in the input, but we'll extract UID when saving
          const fullUrl = message.records?.find((record: any) => record.recordType === 'url')
          if (fullUrl) {
            try {
              const url = new TextDecoder().decode(fullUrl.data)
              setCardUid(url) // Show full URL in input
              setMessage({ type: 'success', text: `NFC card read successfully! UID: ${extractedUid}` })
              console.log('Full URL set in input:', url)
              console.log('UID extracted for saving:', extractedUid)
            } catch (error) {
              setCardUid(extractedUid) // Fallback to just UID
              setMessage({ type: 'success', text: `NFC card read successfully! UID: ${extractedUid}` })
            }
          } else {
            setCardUid(extractedUid) // Fallback to just UID
            setMessage({ type: 'success', text: `NFC card read successfully! UID: ${extractedUid}` })
          }
        } else {
          setMessage({ type: 'error', text: 'Could not extract UID from NFC card' })
          console.log('No UID found in NFC card')
        }

        setNfcLoading(false)
      })

    } catch (error: any) {
      console.log('Argh! ' + error)
      setNfcLoading(false)
      setMessage({ type: 'error', text: `Failed to read NFC: ${error.message || 'Unknown error'}` })
    }
  }

  const handleClaimCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardUid.trim()) return

    setLoading(true)
    setMessage(null)

    // Extract UID from URL if it's a full URL, otherwise use as-is
    let uidToSave = cardUid.trim()

    try {
      // Check if cardUid is a URL
      if (cardUid.includes('://')) {
        const urlObj = new URL(cardUid)
        const extractedUid = urlObj.searchParams.get('uid')
        if (extractedUid) {
          uidToSave = extractedUid.toUpperCase()
          console.log('💾 Saving UID extracted from URL:', uidToSave)
        }
      }
    } catch (error) {
      console.log('Not a URL, using value as-is:', uidToSave)
    }

    try {
      const response = await fetch('/api/cards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address || ''
        },
        body: JSON.stringify({ cardUid: uidToSave }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim card')
      }

      setMessage({ type: 'success', text: 'Card claimed successfully!' })
      setCardUid('')
      loadCards() // Reload the cards list
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': address || ''
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete card')
      }

      setMessage({ type: 'success', text: 'Card deleted successfully!' })
      loadCards() // Reload the cards list
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">My Cards</h1>
            <p className="text-gray-600">
              Manage your NFC cards and assign them to POAP drops
            </p>
          </div>

          {!isConnected ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to manage your NFC cards.
              </p>
            </div>
          ) : (
            <>
              {/* Claim Card Form */}
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Claim a New Card</h2>
                <p className="text-gray-600 mb-6">
                  Enter the UID of your NTAG424 DNA card to claim ownership
                </p>

                <form onSubmit={handleClaimCard} className="space-y-4">
                  <div>
                    <label htmlFor="cardUid" className="block text-sm font-medium text-gray-700 mb-2">
                      Card UID
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        id="cardUid"
                        value={cardUid}
                        onChange={(e) => setCardUid(e.target.value)}
                        placeholder="https://card.0xpo.app/?uid=DEMOUID1234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={loading || nfcLoading}
                        required
                      />
                      {isChromeAndroid ? (
                        <>
                          <button
                            type="button"
                            onClick={handleNfcRead}
                            disabled={loading || nfcLoading}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                          >
                            {nfcLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Reading NFC Card...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xl">📱</span>
                                <span>Scan NFC Card</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">📱</span>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                NFC functionality requires Chrome on Android
                              </p>
                              <p className="text-xs text-yellow-600 mt-1">
                                Please use Chrome browser on an Android device to scan NFC cards
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isChromeAndroid && (
                      <div className="text-sm mt-2">
                        <p className="text-blue-600">📱 Click &quot;Scan NFC&quot; and tap your NFC card to read the UID</p>
                      </div>
                    )}
                  </div>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !cardUid.trim()}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Claiming Card...' : 'Claim Card'}
                  </button>
                </form>
              </div>

              {/* My Cards List */}
              {cards.length > 0 && (
                <div className="card mb-8">
                  <h2 className="text-xl font-semibold mb-4">My Cards ({cards.length})</h2>
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div key={card.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 break-all">
                              {card.ntag_uid}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Added {new Date(card.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="flex-shrink-0 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-3">How to Use NFC Cards</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                    <div>
                      <strong>Claim your card:</strong> Enter the UID printed on your NTAG424 DNA card to claim ownership
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                    <div>
                      <strong>Assign to drop:</strong> Link your card to one of your POAP drops for distribution
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                    <div>
                      <strong>Share the card:</strong> When someone taps the card, they&apos;ll get a unique POAP claim URL
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}