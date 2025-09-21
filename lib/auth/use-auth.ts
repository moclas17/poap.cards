'use client'

import { useAccount } from 'wagmi'

export function useAuth() {
  const { address, isConnected } = useAccount()

  // Simple authentication: just check if wallet is connected
  const isAuthenticated = isConnected && !!address
  const isLoading = false

  const logout = () => {
    // Logout is handled by disconnecting the wallet
    console.log('To logout, disconnect your wallet')
  }

  return {
    isAuthenticated,
    isLoading,
    logout,
  }
}