'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useState } from 'react'

export function ConnectButton() {
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()
  const [isOpening, setIsOpening] = useState(false)

  const handleConnect = async () => {
    try {
      setIsOpening(true)
      console.log('🔗 Opening wallet modal for mobile connection...')
      await open()
    } catch (error) {
      console.error('❌ Wallet connection error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown wallet connection error'
      alert(`Wallet Connection Error: ${errorMessage}`)
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isOpening}
      className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
    >
      {isOpening ? 'Opening...' : isConnected ? 'Account' : 'Login'}
    </button>
  )
}