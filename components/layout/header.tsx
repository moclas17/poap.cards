'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import Link from 'next/link'
import { ConnectButton } from '@/components/ui/connect-button'

export function Header() {
  const { address, isConnected } = useAppKitAccount()
  const { open } = useAppKit()

  const handleWalletClick = () => {
    open()
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-xl md:text-2xl font-bold tracking-wide">
              <span className="text-purple-400">P</span>
              <span className="text-green-400">O</span>
              <span className="text-blue-400">A</span>
              <span className="text-yellow-400">P</span>
              <span className="text-gray-700">.</span>
              <span className="text-purple-600">Cards</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isConnected && (
              <>
                <Link
                  href="/drops"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  My Drops
                </Link>
                <Link
                  href="/cards"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  My Cards
                </Link>
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {isConnected ? (
              <>
                {/* Desktop wallet info */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                  </div>
                  <button
                    onClick={handleWalletClick}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Wallet
                  </button>
                </div>

                {/* Mobile wallet info */}
                <div className="md:hidden flex items-center space-x-2">
                  <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {address && `${address.slice(0, 4)}...${address.slice(-3)}`}
                  </div>
                  <button
                    onClick={handleWalletClick}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    🔗
                  </button>
                </div>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Tab style */}
      {isConnected && (
        <div className="md:hidden">
          <nav className="flex justify-center space-x-0 px-4">
            <Link
              href="/drops"
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 px-4 mobile-nav-tab rounded-tl-lg font-medium transition-all duration-200 border-t border-l border-purple-200 hover:border-purple-300 text-sm flex-1 text-center max-w-32"
            >
              📦 My Drops
            </Link>
            <Link
              href="/cards"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 px-4 mobile-nav-tab rounded-tr-lg font-medium transition-all duration-200 border-t border-r border-blue-200 hover:border-blue-300 text-sm flex-1 text-center max-w-32"
            >
              📱 My Cards
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}