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
      await open()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      {isOpening ? 'Opening...' : isConnected ? 'Open Wallet' : 'Connect Wallet'}
    </button>
  )
}