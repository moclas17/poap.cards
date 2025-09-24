import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'viem/chains'

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'placeholder-project-id'

// Set up metadata
const metadata = {
  name: 'POAP Card',
  description: 'Dispense POAPs with NFC cards using secure dynamic messaging',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://0xpo.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sepolia],
  projectId
})

// Create the AppKit modal with Wagmi adapter
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, sepolia],
  metadata,
  features: {
    email: false,
    socials: [],
    swaps: false,
    onramp: false
  },
  debug: false,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#6E56CF'
  },
  allWallets: 'SHOW',
  featuredWalletIds: [
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase (better mobile support)
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '18388be9ac2d02726dbac9777c96efaac06d462d741b0000175b1af45abfad3b'  // Zerion
  ],
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '18388be9ac2d02726dbac9777c96efaac06d462d741b0000175b1af45abfad3b', // Zerion
    '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // BitGet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'  // Uniswap
  ],
  // Mobile optimizations
  enableEIP6963: true,
  enableCoinbase: true,
  enableInjected: true,
  enableWalletConnect: true
})

// Export wagmi config for providers
export const wagmiConfig = wagmiAdapter.wagmiConfig