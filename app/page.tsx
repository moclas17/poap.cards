'use client'

import { Header } from '@/components/layout/header'

export default function HomePage() {

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
                Compatible with NTAG215/216/213 (basic) and NTAG424 DNA (secure) cards
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">
                Smart Distribution
              </h3>
              <p className="text-gray-600">
                Secure NFC taps with cryptographic verification available for NTAG424 DNA cards
              </p>
            </div>
          </div>

          {/* Supported Card Types Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  📱 Supported NFC Card Types
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  POAP Cards works with a wide range of NFC cards to fit your budget and security needs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 rounded-full p-2">
                      <span className="text-green-600 text-xl">🔒</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">NTAG424 DNA</h3>
                      <span className="text-sm text-green-600 font-medium">Secure Cards</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Cryptographic verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Clone-resistant technology
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Perfect for high-value events
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <span className="text-blue-600 text-xl">📋</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">NTAG215/216/213</h3>
                      <span className="text-sm text-blue-600 font-medium">Basic Cards</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500">✓</span>
                      Easy to set up and program
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500">✓</span>
                      Budget-friendly option
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500">✓</span>
                      Great for casual events
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center mt-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-purple-700">
                    💡 <strong>Pro Tip:</strong> Both card types work seamlessly with POAP Cards.
                    Choose NTAG424 DNA for maximum security or NTAG215/216/213 for cost-effective distributions.
                  </p>
                </div>
              </div>
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