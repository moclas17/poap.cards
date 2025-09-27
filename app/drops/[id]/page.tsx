'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAppKitAccount } from '@reown/appkit/react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

interface DropDetail {
  id: string
  name: string
  description?: string
  image_url?: string
  poap_event_id?: number
  total_codes: number
  created_at: string
  owner_address: string
}

interface PoapCode {
  id: string
  claim_url: string
  qr_hash: string
  is_used: boolean
  used_by_address?: string
  used_by_ens?: string
  used_by_email?: string
  used_at?: string
}

interface Card {
  id: string
  ntag_uid: string
  name: string
  is_assigned: boolean
  assignment_id?: string
  assigned_at?: string
}

// Helper function to get display name with priority: ENS > address > email
function getClaimedByDisplay(code: PoapCode): string {
  if (code.used_by_ens) {
    return code.used_by_ens
  }
  if (code.used_by_address) {
    return `${code.used_by_address.slice(0, 6)}...${code.used_by_address.slice(-4)}`
  }
  if (code.used_by_email) {
    return code.used_by_email
  }
  return '—'
}

type SortField = 'index' | 'code' | 'status' | 'claimedBy' | 'claimedDate'
type SortDirection = 'asc' | 'desc'

export default function DropDetailPage() {
  const params = useParams()
  const { isConnected } = useAppKitAccount()
  const [drop, setDrop] = useState<DropDetail | null>(null)
  const [codes, setCodes] = useState<PoapCode[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [assignedCards, setAssignedCards] = useState<Card[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('index')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    if (isConnected && params.id) {
      fetchDropDetails()
      fetchCodes()
      fetchCards()
      fetchAssignedCards()
    } else {
      setLoading(false)
    }
  }, [isConnected, params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDropDetails = async () => {
    try {
      const response = await fetch(`/api/drops/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch drop details')
      const data = await response.json()
      setDrop(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchCodes = async () => {
    try {
      const response = await fetch(`/api/drops/${params.id}/codes`)
      if (!response.ok) throw new Error('Failed to fetch codes')
      const data = await response.json()
      setCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards/my-cards')
      if (!response.ok) throw new Error('Failed to fetch cards')
      const data = await response.json()
      setCards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedCards = async () => {
    try {
      const assignedResponse = await fetch(`/api/drops/${params.id}/assigned-cards`)
      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json()
        setAssignedCards(assignedData)
      }
    } catch (err) {
      console.error('Failed to fetch assigned cards:', err)
    }
  }

  const handleAssignCard = async () => {
    if (!selectedCard) return

    try {
      const response = await fetch(`/api/cards/${selectedCard}/assign-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropId: params.id })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to assign card (${response.status})`)
      }

      // Refresh cards data
      fetchCards()
      fetchAssignedCards()
      setSelectedCard('')
      alert('Card assigned successfully!')
    } catch (err) {
      console.error('Card assignment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign card')
    }
  }

  const handleUnassignCard = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this card from the drop?')) {
      return
    }

    try {
      const response = await fetch(`/api/card-assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to unassign card (${response.status})`)
      }

      // Refresh cards data
      fetchCards()
      fetchAssignedCards()
      alert('Card removed successfully!')
    } catch (err) {
      console.error('Card unassignment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove card')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to view drop details.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading drop details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center py-12">
              <div className="text-red-600 text-lg font-medium mb-2">
                Error Loading Drop
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/drops" className="btn-primary">
                Back to Drops
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Drop Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                The requested drop could not be found.
              </p>
              <Link href="/drops" className="btn-primary">
                Back to Drops
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const usedCodes = codes.filter(code => code.is_used).length
  const availableCodes = codes.length - usedCodes

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedCodes = [...codes].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1

    switch (sortField) {
      case 'index':
        const indexA = codes.indexOf(a)
        const indexB = codes.indexOf(b)
        return (indexA - indexB) * direction

      case 'code':
        return a.qr_hash.localeCompare(b.qr_hash) * direction

      case 'status':
        const statusA = a.is_used ? 1 : 0
        const statusB = b.is_used ? 1 : 0
        return (statusA - statusB) * direction

      case 'claimedBy':
        const claimedByA = getClaimedByDisplay(a)
        const claimedByB = getClaimedByDisplay(b)
        return claimedByA.localeCompare(claimedByB) * direction

      case 'claimedDate':
        const dateA = a.used_at ? new Date(a.used_at).getTime() : 0
        const dateB = b.used_at ? new Date(b.used_at).getTime() : 0
        return (dateA - dateB) * direction

      default:
        return 0
    }
  })

  const exportCodes = async (format: 'csv' | 'json') => {
    setExportLoading(true)
    try {
      const response = await fetch(`/api/drops/${params.id}/export?format=${format}`)
      if (!response.ok) throw new Error('Failed to export codes')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${drop?.name || 'drop'}-codes.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-card-c/20 via-card-a/20 to-card-r/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/drops" className="text-primary hover:underline mb-4 inline-block">
              ← Back to Drops
            </Link>

            {/* Desktop Header */}
            <div className="hidden md:flex items-start gap-6 mb-6">
              {drop.image_url && (
                <img
                  src={drop.image_url}
                  alt={drop.name}
                  className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary mb-2">{drop.name}</h1>
                {drop.description && (
                  <p className="text-gray-600 mb-4">{drop.description}</p>
                )}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-800">{codes.length}</div>
                    <div className="text-xs text-gray-600">Total Codes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{availableCodes}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{usedCodes}</div>
                    <div className="text-xs text-gray-600">Used</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">{assignedCards.length}</div>
                    <div className="text-xs text-gray-600">Assigned Cards</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden mb-6">
              {/* Mobile: Title and Image Row */}
              <div className="flex items-start gap-4 mb-4">
                {drop.image_url && (
                  <img
                    src={drop.image_url}
                    alt={drop.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-primary mb-2">{drop.name}</h1>
                  {drop.description && (
                    <p className="text-sm text-gray-600">{drop.description}</p>
                  )}
                </div>
              </div>

              {/* Mobile: Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{codes.length}</div>
                  <div className="text-xs text-gray-600">Total Codes</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{availableCodes}</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{usedCodes}</div>
                  <div className="text-xs text-gray-600">Used</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{assignedCards.length}</div>
                  <div className="text-xs text-gray-600">Assigned Cards</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Distribution Progress</span>
                <span>{codes.length > 0 ? Math.round((usedCodes / codes.length) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: codes.length > 0 ? `${(usedCodes / codes.length) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card Assignment and Management */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Assign New Card */}
            <div className="card">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Assign New NFC Card</h2>
              <div className="space-y-4">
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a card...</option>
                  {cards.filter(card => !card.is_assigned).map(card => (
                    <option key={card.id} value={card.ntag_uid}>
                      {card.name} ({card.ntag_uid})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignCard}
                  disabled={!selectedCard}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Card
                </button>
                {cards.filter(card => !card.is_assigned).length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    No unassigned cards available
                  </p>
                )}
              </div>
            </div>

            {/* Assigned Cards */}
            <div className="card">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Assigned Cards ({assignedCards.length})</h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {assignedCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{card.name}</div>
                      <span className="font-mono text-sm text-gray-600">UID: {card.ntag_uid}</span>
                    </div>
                    <button
                      onClick={() => handleUnassignCard(card.assignment_id!)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {assignedCards.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No cards assigned to this drop yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* POAP Codes List */}
          <div className="card">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">POAP Codes ({codes.length})</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportCodes('csv')}
                  disabled={exportLoading || codes.length === 0}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  onClick={() => exportCodes('json')}
                  disabled={exportLoading || codes.length === 0}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'Export JSON'}
                </button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">POAP Codes ({codes.length})</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportCodes('csv')}
                  disabled={exportLoading || codes.length === 0}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'CSV'}
                </button>
                <button
                  onClick={() => exportCodes('json')}
                  disabled={exportLoading || codes.length === 0}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {exportLoading ? 'Exporting...' : 'JSON'}
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-2">
              <button
                onClick={() => handleSort('index')}
                className="col-span-1 text-left hover:text-primary transition-colors flex items-center gap-1"
              >
                #
                {sortField === 'index' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSort('code')}
                className="col-span-3 text-left hover:text-primary transition-colors flex items-center gap-1"
              >
                Code
                {sortField === 'code' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSort('status')}
                className="col-span-2 text-left hover:text-primary transition-colors flex items-center gap-1"
              >
                Status
                {sortField === 'status' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSort('claimedBy')}
                className="col-span-3 text-left hover:text-primary transition-colors flex items-center gap-1"
              >
                Claimed By
                {sortField === 'claimedBy' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSort('claimedDate')}
                className="col-span-2 text-left hover:text-primary transition-colors flex items-center gap-1"
              >
                Claimed Date
                {sortField === 'claimedDate' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </button>

              <div className="col-span-1">Actions</div>
            </div>

            {/* Mobile/Desktop Responsive List */}
            <div className="space-y-2">
              {sortedCodes.map((code, index) => (
                <div
                  key={code.id}
                  className={`p-3 rounded-lg border ${
                    code.is_used
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  {/* Desktop Table Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <span className="text-sm font-mono text-gray-500">
                        #{String(sortField === 'index' ? (codes.indexOf(code) + 1) : (index + 1)).padStart(3, '0')}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <div className="font-mono text-sm text-gray-800 truncate">
                        {code.qr_hash}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        code.is_used
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {code.is_used ? 'Claimed' : 'Available'}
                      </span>
                    </div>

                    <div className="col-span-3">
                      {code.is_used ? (
                        <div className="text-sm text-gray-800">
                          {getClaimedByDisplay(code)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {code.used_at ? (
                        <div className="text-sm text-gray-600">
                          {new Date(code.used_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>

                    <div className="col-span-1">
                      {!code.is_used && (
                        <a
                          href={code.claim_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                          title="View Claim Link"
                        >
                          Link
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        #{String(sortField === 'index' ? (codes.indexOf(code) + 1) : (index + 1)).padStart(3, '0')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        code.is_used
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {code.is_used ? 'Claimed' : 'Available'}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-gray-800 mb-2 break-all">
                      {code.qr_hash}
                    </div>

                    {code.is_used && (
                      <div className="text-xs text-gray-600 mb-2">
                        <div><strong>Claimed by:</strong> {getClaimedByDisplay(code)}</div>
                        {code.used_at && (
                          <div><strong>Date:</strong> {new Date(code.used_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}

                    {!code.is_used && (
                      <div className="text-right">
                        <a
                          href={code.claim_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {codes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No POAP codes found for this drop.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}