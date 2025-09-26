'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { Header } from '@/components/layout/header'
import Link from 'next/link'

export default function HomePage() {
  const { address, isConnected } = useAppKitAccount()

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
              <span className="text-gray-700">.</span>
              <span className="text-purple-600">Cards</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Dispense POAPs with NFC cards using secure dynamic messaging.
              Connect with your email, social account, or crypto wallet to get started.
            </p>
          </div>

          {/* Connection Status */}
          {isConnected && (
            <div className="mb-12">
              <div className="bg-white rounded-xl p-8 shadow-sm border max-w-md mx-auto">
                <div className="text-green-600 text-lg font-medium mb-2">
                  ✅ Wallet Connected!
                </div>
                <p className="text-gray-600 mb-6">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>

                <div className="space-y-3">
                  <Link
                    href="/drops"
                    className="block w-full btn-primary text-center"
                  >
                    Manage My Drops
                  </Link>
                  <Link
                    href="/cards"
                    className="block w-full btn-secondary text-center"
                  >
                    Manage My Cards
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
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

          {/* Video Demo Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  🎬 See POAP Cards in Action
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Watch how easy it is to distribute POAPs using NFC cards at events.
                  From setup to claiming, see the complete user experience.
                </p>
              </div>

              <div className="relative w-full max-w-3xl mx-auto" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/wvrE21USiWk"
                  title="YouTube video player - POAP Cards Demo"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Experience the future of event engagement with POAP Cards
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}