import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { cookieStorage, createStorage } from 'wagmi'

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'placeholder-project-id'

if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
  console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

// Set up metadata
const metadata = {
  name: 'POAP Card',
  description: 'Dispense POAPs with NFC cards using secure dynamic messaging',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://0xpo.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks: [mainnet, sepolia]
})

// Create the modal
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
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#6E56CF'
  }
})

export const config = wagmiAdapter.wagmiConfig