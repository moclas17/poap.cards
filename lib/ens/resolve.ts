import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

/**
 * Create a viem public client for ENS resolution
 */
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_MAINNET || 'https://eth.llamarpc.com')
})

/**
 * Resolve ENS name for an Ethereum address
 * Returns null if no ENS name is found or if there's an error
 */
export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      console.warn(`Invalid address format: ${address}`)
      return null
    }

    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`
    })

    return ensName
  } catch (error) {
    // ENS resolution can fail for various reasons (no ENS, network issues, etc.)
    // We don't want to break the auth flow, so we just return null
    console.error(`Failed to resolve ENS for ${address}:`, error)
    return null
  }
}
