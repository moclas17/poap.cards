'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'

export function ConnectButton() {
  const { open } = useAppKit()
  const { isConnected } = useAccount()

  return (
    <button
      onClick={() => open()}
      className="btn-primary text-lg px-8 py-3"
    >
      {isConnected ? 'Open Wallet' : 'Connect Wallet'}
    </button>
  )
}