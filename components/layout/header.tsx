'use client'

import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import Link from 'next/link'
import { ConnectButton } from '@/components/ui/connect-button'

export function Header() {
  const { address, isConnected } = useAccount()
  const { open } = useAppKit()

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-purple-400">P</span>
              <span className="text-green-400">O</span>
              <span className="text-blue-400">A</span>
              <span className="text-yellow-400">P</span>
              <span className="text-purple-600 ml-1">Card</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isConnected && (
              <>
                <a
                  href="/drops"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  My Drops
                </a>
                <a
                  href="/cards"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  My Cards
                </a>
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>
                <button
                  onClick={() => open()}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Wallet
                </button>
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}