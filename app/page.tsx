'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet-context'
import { WalletButton } from '@txnlab/use-wallet-ui-react'
import { NeonButton } from '@/components/cyber-ui'

// Animated stat ticker
function StatTicker({
  value,
  label,
  prefix = '',
  suffix = '',
}: {
  value: number
  label: string
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const step = value / 60
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, value)
      setDisplay(Math.floor(current))
      if (current >= value) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black text-electric-cyan neon-text-cyan tabular-nums">
        {prefix}{display.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-muted-silver uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}

// Floating grid lines background
function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base grid */}
      <div className="absolute inset-0 cyber-grid opacity-40" />

      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-px opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--electric-cyan) 50%, transparent 100%)',
          animation: 'scanline 6s linear infinite',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-electric-cyan/60" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-electric-cyan/60" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-neon-magenta/60" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-neon-magenta/60" />

      {/* Ambient glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-[120px] opacity-20"
        style={{ background: 'radial-gradient(ellipse, var(--electric-cyan), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[400px] h-[300px] blur-[100px] opacity-15"
        style={{ background: 'radial-gradient(ellipse, var(--neon-magenta), transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[300px] blur-[100px] opacity-15"
        style={{ background: 'radial-gradient(ellipse, var(--acid-purple), transparent 70%)' }}
      />
    </div>
  )
}

const features = [
  {
    icon: '◈',
    title: 'Dual Reputation',
    description: 'On-chain scores for both posters and hunters. Trust is earned, not assumed.',
    color: 'cyan',
  },
  {
    icon: '◫',
    title: 'Batch Payroll',
    description: 'Pay hundreds of contributors in a single Algorand atomic transfer. Near-zero fees.',
    color: 'magenta',
  },
  {
    icon: '⬡',
    title: 'Algorand L1',
    description: 'Finality in 3.7 seconds. Transactions cost fractions of a cent, always.',
    color: 'purple',
  },
  {
    icon: '◉',
    title: 'Smart Escrow',
    description: 'Funds locked in ARC-4 contracts. Released only when criteria are verifiably met.',
    color: 'cyan',
  },
]

const glowMap = {
  cyan: 'border-electric-cyan/40 hover:border-electric-cyan hover:shadow-[0_0_20px_oklch(0.8_0.2_195/0.3)]',
  magenta: 'border-neon-magenta/40 hover:border-neon-magenta hover:shadow-[0_0_20px_oklch(0.7_0.25_330/0.3)]',
  purple: 'border-acid-purple/40 hover:border-acid-purple hover:shadow-[0_0_20px_oklch(0.6_0.25_290/0.3)]',
}

const iconMap = {
  cyan: 'text-electric-cyan',
  magenta: 'text-neon-magenta',
  purple: 'text-acid-purple',
}

export default function LandingPage() {
  const router = useRouter()
  const { isConnected } = useWallet()

  return (
    <div className="relative min-h-screen flex flex-col bg-deep-void text-foreground overflow-hidden scanlines">
      <CyberGrid />

      {/* ── Minimal top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 h-16 border-b border-electric-cyan/20">
        <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan to-neon-magenta">
          ALGOCRED
        </span>
        <div className="wui-custom-trigger">
          <WalletButton />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 md:px-10 pt-20 pb-16 text-center">

        {/* Eyebrow label */}
        <div className="mb-6 inline-flex items-center gap-2 border border-electric-cyan/40 bg-electric-cyan/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-electric-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse" />
          Algorand Layer‑1 · ARC‑4 Smart Contracts
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter text-balance mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-acid-purple to-neon-magenta animate-neon-pulse">
            ALGOCRED
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl text-base md:text-lg text-muted-silver leading-relaxed text-pretty mb-10">
          Dual‑reputation bounties and batch payroll on Algorand's fast,{' '}
          <span className="text-electric-cyan font-semibold">low‑fee</span> Layer‑1.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
          {/* Real wallet connect button from @txnlab/use-wallet-ui-react */}
          <div className="wui-custom-trigger min-w-48">
            <WalletButton />
          </div>
          <Link href="/bounties">
            <NeonButton size="lg" variant="outline" className="min-w-48">
              Browse Bounties
            </NeonButton>
          </Link>
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-silver/70 tracking-wide max-w-sm text-balance">
          Connect your Algorand wallet to unlock your dashboard, post bounties, and run payroll.
        </p>

        {/* Stats bar */}
        <div className="mt-16 w-full max-w-2xl grid grid-cols-3 gap-px bg-electric-cyan/10 border border-electric-cyan/20">
          <div className="bg-deep-void/80 px-4 py-5">
            <StatTicker value={2847} label="Active Bounties" />
          </div>
          <div className="bg-deep-void/80 px-4 py-5 border-x border-electric-cyan/20">
            <StatTicker value={91420} label="ALGO Paid Out" suffix="+" />
          </div>
          <div className="bg-deep-void/80 px-4 py-5">
            <StatTicker value={1204} label="Verified Hunters" />
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 md:px-10 pb-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-muted-silver mb-8">
            Built for speed. Designed for trust.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`glass border p-5 transition-all duration-300 ${glowMap[f.color as keyof typeof glowMap]}`}
              >
                <span className={`text-3xl mb-3 block ${iconMap[f.color as keyof typeof iconMap]}`}>
                  {f.icon}
                </span>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-silver leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <footer className="relative z-10 border-t border-electric-cyan/20 px-6 md:px-10 h-12 flex items-center justify-between">
        <p className="text-xs text-muted-silver/50 uppercase tracking-widest">ALGOCRED</p>
        <p className="text-xs text-muted-silver/50 uppercase tracking-widest">Powered by Algorand</p>
      </footer>
    </div>
  )
}
