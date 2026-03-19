'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { mockUsers, mockTransactions, type User, type Transaction } from './mock-data'

interface WalletContextType {
  isConnected: boolean
  isConnecting: boolean
  user: User | null
  balance: number
  setBalance: (balance: number) => void
  transactions: Transaction[]
  connect: () => Promise<void>
  disconnect: () => void
  connected: boolean
  walletAddress: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState(7.5)
  const [transactions] = useState<Transaction[]>(mockTransactions)

  const connect = useCallback(async () => {
    setIsConnecting(true)
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setUser(mockUsers[0])
    setIsConnected(true)
    setIsConnecting(false)
  }, [])

  const disconnect = useCallback(() => {
    setUser(null)
    setIsConnected(false)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        user,
        balance,
        setBalance,
        transactions,
        connect,
        disconnect,
        connected: isConnected,
        walletAddress: user?.walletAddress || null
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
