'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

export function useAuth() {
  const { address, isConnected } = useAppKitAccount()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (!isConnected || !address) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        setIsAuthenticated(data.isAuthenticated)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [isConnected, address])

  const logout = () => {
    setIsAuthenticated(false)
    // Logout is handled by disconnecting the wallet
    console.log('To logout, disconnect your wallet')
  }

  return {
    isAuthenticated,
    isLoading,
    logout,
  }
}