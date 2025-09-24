'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import Link from 'next/link'
import { ConnectButton } from '@/components/ui/connect-button'
import { useState, useEffect } from 'react'

export function Header() {
  const { address, isConnected } = useAppKitAccount()
  const { open } = useAppKit()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleWalletClick = () => {
    open()
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-xl md:text-2xl font-bold">
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

            {/* Mobile menu toggle */}
            {isConnected && (
              <button
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                ☰
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && isConnected && (
          <nav className="md:hidden mt-4 pt-4 border-t space-y-2">
            <Link
              href="/drops"
              className="block py-2 text-gray-600 hover:text-purple-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Drops
            </Link>
            <Link
              href="/cards"
              className="block py-2 text-gray-600 hover:text-purple-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Cards
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}