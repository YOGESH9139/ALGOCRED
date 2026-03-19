'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { WalletProvider, useWallet } from '@/lib/wallet-context'
import { ModalProvider, useModal } from '@/lib/modal-context'
import { NeonButton } from './cyber-ui'
import { ModalSystem } from './modal-system'

// Cursor glow component for dashboard
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.matchMedia('(hover: none)').matches)
    
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`
        glowRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-electric-cyan/20 via-neon-magenta/10 to-transparent rounded-full blur-3xl" />
      </div>
    )
  }

  return (
    <div
      ref={glowRef}
      className="fixed pointer-events-none z-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
      style={{
        background: 'radial-gradient(circle, oklch(0.8 0.2 195 / 0.15), oklch(0.7 0.25 330 / 0.1) 40%, transparent 70%)',
        filter: 'blur(40px)'
      }}
    />
  )
}

// Sidebar navigation
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/bounties', label: 'Browse Bounties', icon: '◉' },
  { href: '/bounties/create', label: 'Create Bounty', icon: '⊕' },
  { href: '/payroll', label: 'Batch Payroll', icon: '◫' },
  { href: '/profile', label: 'My Profile', icon: '◎' },
]

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-deep-void/80 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-charcoal-steel/95 backdrop-blur-md border-r border-electric-cyan/30 z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-electric-cyan/20">
          <Link href="/dashboard" className="text-2xl font-black tracking-wider">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-neon-magenta">
              ALGOCRED
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/bounties' && pathname.startsWith('/bounties') && pathname !== '/bounties/create') ||
              (item.href === '/bounties/create' && pathname === '/bounties/create')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-electric-cyan/20 text-electric-cyan border-l-2 border-electric-cyan shadow-[0_0_10px_oklch(0.8_0.2_195/0.3)]' 
                    : 'text-muted-silver hover:bg-electric-cyan/10 hover:text-electric-cyan border-l-2 border-transparent'
                  }
                `}
              >
                <span className={`text-lg ${isActive ? 'text-electric-cyan' : 'text-muted-silver group-hover:text-electric-cyan'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Algorand Badge */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="glass rounded-lg p-3 text-center">
            <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Powered by</p>
            <p className="text-sm font-bold text-electric-cyan">Algorand</p>
          </div>
        </div>
      </aside>
    </>
  )
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const { balance, connected, connect, disconnect, isConnecting } = useWallet()
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard / Overview',
      '/bounties': 'Browse Bounties',
      '/bounties/create': 'Create Bounty',
      '/payroll': 'Batch Payroll',
      '/profile': 'My Profile',
    }
    return titles[pathname] || 'ALGOCRED'
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-charcoal-steel/80 backdrop-blur-md border-b border-electric-cyan/30 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden text-electric-cyan hover:text-neon-magenta transition-colors p-2"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Page title / breadcrumbs */}
      <div className="hidden lg:block">
        <p className="text-sm text-muted-silver uppercase tracking-widest">{getPageTitle()}</p>
      </div>

      {/* Wallet section */}
      <div className="relative">
        {connected ? (
          <button 
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            className="flex items-center gap-2 bg-deep-void/50 border border-electric-cyan/50 rounded-lg px-4 py-2 hover:border-electric-cyan transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-toxic-green animate-pulse" />
            <span className="text-electric-cyan font-mono text-sm">ALGO...{Math.floor(Math.random() * 9000 + 1000)}</span>
            <span className="text-muted-silver group-hover:text-electric-cyan transition-colors">▾</span>
          </button>
        ) : (
          <NeonButton onClick={connect} loading={isConnecting} size="sm">
            Connect Algorand Wallet
          </NeonButton>
        )}

        {/* Wallet dropdown */}
        {showWalletMenu && connected && (
          <div className="absolute right-0 top-full mt-2 w-64 glass rounded-lg border border-electric-cyan/30 overflow-hidden">
            <div className="p-4 border-b border-electric-cyan/20">
              <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Balance</p>
              <p className="text-2xl font-black text-electric-cyan">{balance.toLocaleString()} ALGO</p>
            </div>
            <div className="p-2">
              <button 
                onClick={() => { disconnect(); setShowWalletMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-neon-magenta hover:bg-neon-magenta/10 rounded transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const isLanding = pathname === '/'

  if (isLanding) {
    return (
      <div className="min-h-screen bg-deep-void">
        <ModalSystem />
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deep-void">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <main className="lg:ml-64 pt-16 min-h-screen">
        {children}
      </main>
      <ModalSystem />
    </div>
  )
}

interface RootLayoutClientProps {
  children: React.ReactNode
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <WalletProvider>
      <ModalProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </ModalProvider>
    </WalletProvider>
  )
}
