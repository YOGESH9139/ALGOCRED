'use client'

/**
 * Wallet context compatibility bridge.
 *
 * All pages use `useWallet()` from this file and expect:
 *   { isConnected, connected, isConnecting, connect, disconnect,
 *     walletAddress, user, balance, setBalance, transactions }
 *
 * We derive those values from @txnlab/use-wallet-react so real
 * Algorand wallet connections (Pera, Defly, Lute) work out of the box.
 */

import { useWallet as useTxnWallet } from '@txnlab/use-wallet-react'
import { mockTransactions, type Transaction } from './mock-data'

// ── Re-export the User type so existing code keeps working ──────────────────
export type { User, Transaction } from './mock-data'

// ── Shape that every page expects ───────────────────────────────────────────
export interface WalletContextShape {
  isConnected: boolean
  connected: boolean
  isConnecting: boolean
  walletAddress: string | null
  user: { displayName: string; walletAddress: string } | null
  balance: number
  setBalance: (b: number) => void
  transactions: Transaction[]
  connect: () => Promise<void>
  disconnect: () => void
  activeAccount: any | null
  transactionSigner: any | null
}

// ── The bridge hook ─────────────────────────────────────────────────────────
export function useWallet(): WalletContextShape {
  const { activeAddress, activeWallet, activeAccount, transactionSigner } = useTxnWallet()

  const isConnected = !!activeAddress
  const connected = isConnected

  const walletAddress = activeAddress ?? null

  // Derive a display name from the first+last 4 chars of the wallet address
  const displayName = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : null

  const user = displayName && walletAddress
    ? { displayName, walletAddress }
    : null

  // connect() is a no-op here — the WalletButton component handles opening the modal
  // Pages that need to trigger connect should render <WalletButton /> instead
  const connect = async () => {}

  const disconnect = () => {
    activeWallet?.disconnect()
  }

  return {
    isConnected,
    connected,
    isConnecting: false,
    walletAddress,
    user,
    balance: 0,
    setBalance: () => {},
    transactions: mockTransactions,
    connect,
    disconnect,
    activeAccount: activeAccount || null,
    transactionSigner,
  }
}
