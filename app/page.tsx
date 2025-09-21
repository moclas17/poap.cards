'use client'

import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { ConnectButton } from '@/components/ui/connect-button'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/auth/use-auth'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-green-50 to-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold mb-6">
              <span className="text-purple-400">P</span>
              <span className="text-green-400">O</span>
              <span className="text-blue-400">A</span>
              <span className="text-yellow-400">P</span>
              <span className="text-purple-600 ml-4">Card</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Dispense POAPs with NFC cards using secure dynamic messaging.
              Connect your wallet to manage your POAP distributions.
            </p>
          </div>

          {/* Connection Status */}
          <div className="mb-12">
            {!isConnected ? (
              <div className="text-center">
                <ConnectButton />
                <p className="text-gray-500 mt-4">
                  Connect your wallet to get started
                </p>
              </div>
            ) : isLoading ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border max-w-md mx-auto text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <div className="text-purple-600 text-lg font-medium mb-2">
                  Authenticating...
                </div>
                <p className="text-gray-600">
                  Please sign the message in your wallet
                </p>
              </div>
            ) : isAuthenticated ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border max-w-md mx-auto">
                <div className="text-green-600 text-lg font-medium mb-2">
                  ✓ Authenticated
                </div>
                <p className="text-gray-600 mb-6">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>

                <div className="space-y-3">
                  <a
                    href="/drops"
                    className="block w-full btn-primary text-center"
                  >
                    Manage My Drops
                  </a>
                  <a
                    href="/cards"
                    className="block w-full btn-secondary text-center"
                  >
                    Manage My Cards
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border max-w-md mx-auto text-center">
                <div className="text-orange-600 text-lg font-medium mb-2">
                  🔐 Wallet Connected
                </div>
                <p className="text-gray-600 mb-4">
                  Please sign the message to authenticate
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Try Authentication Again
                </button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="text-3xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">
                POAP Distribution
              </h3>
              <p className="text-gray-600">
                Create drops and manage POAP claim codes for your events
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">
                NFC Cards
              </h3>
              <p className="text-gray-600">
                Use NTAG424 DNA cards with secure dynamic messaging
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">
                Secure Tapping
              </h3>
              <p className="text-gray-600">
                Cryptographically secure NFC taps prevent cloning
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}