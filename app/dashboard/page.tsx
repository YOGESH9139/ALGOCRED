'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { Loader2 } from 'lucide-react'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'
import { CursorGlow } from '@/components/root-layout-client'

export default function DashboardPage() {
  const { connected, user, activeAccount } = useWallet()
  const [bountiesPosted, setBountiesPosted] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [reputation, setReputation] = useState(0)
  const [recentActions, setRecentActions] = useState<any[]>([])

  useEffect(() => {
    async function fetchStats() {
      if (!activeAccount || !process.env.NEXT_PUBLIC_MANAGER_APP_ID) {
        setIsLoading(false)
        return
      }

      try {
        const algorand = AlgorandClient.fromConfig({
          algodConfig: { server: "https://testnet-api.algonode.cloud", port: "", token: "" },
          indexerConfig: { server: "https://testnet-idx.algonode.cloud", port: "", token: "" },
        })
        const appId = Number(process.env.NEXT_PUBLIC_MANAGER_APP_ID)
        
        // Fetch Bounties
        const boxResponse = await algorand.client.indexer.searchForApplicationBoxes(appId).do()
        const abiType = algosdk.ABIType.from('(uint64,string,string,string,address,string,uint64,uint64,uint64,uint64,uint64)')
        
        let posted = 0
        let paid = 0
        const activities: any[] = []
        
        for (const box of boxResponse.boxes) {
          try {
            const boxValue = await algorand.client.algod.getApplicationBoxByName(appId, box.name).do()
            if (box.name.length === 8) { // Likely a bounty ID box (uint64)
              const decoded = abiType.decode(boxValue.value) as any[]
              if (decoded[4] === activeAccount.address) {
                posted++
                paid += Number(decoded[6]) / 1e6
                activities.push({
                   icon: '📋',
                   title: `Posted bounty: ${decoded[1]}`,
                   subtitle: `${Number(decoded[6])/1e6} ALGO`,
                   time: 'On-chain'
                })
              }
            } else if (box.name.length === 32) { // Likely a leaderboard address box
              const boxAddr = algosdk.encodeAddress(box.name)
              if (boxAddr === activeAccount.address) {
                setReputation(Number(algosdk.decodeUint64(boxValue.value)))
              }
            }
          } catch (e) { /* skip non-bounty boxes */ }
        }
        
        setBountiesPosted(posted)
        setTotalPaid(paid)
        setRecentActions(activities.slice(0, 5))

      } catch (err) {
        console.error("Dashboard Stats Error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [activeAccount])

  if (!connected) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
        <GlowingCard glow="magenta" className="max-w-md">
          <h1 className="text-2xl font-black text-neon-magenta mb-4">Access Denied</h1>
          <p className="text-muted-silver mb-6">Connect your Algorand wallet to view your dashboard.</p>
        </GlowingCard>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Bounties Posted', value: bountiesPosted.toString(), trend: 'On-chain Live', icon: '◉', color: 'cyan' },
    { label: 'Tasks Completed', value: reputation.toString(), trend: 'On-chain', icon: '✓', color: 'magenta' },
    { label: 'Total Escrowed', value: `${totalPaid} ALGO`, trend: 'On-chain Live', icon: '◫', color: 'purple' },
    { label: 'Reputation Score', value: (reputation * 0.5).toFixed(1), trend: 'Hunter', icon: '★', color: 'cyan' },
  ]

  const recentActivity = [
    { icon: '💰', title: 'Paid 50 USDC to @alice for "Indexer API"', subtitle: 'Rated 5★', time: '2 hours ago' },
    { icon: '📤', title: 'Submitted work for "Design logo"', subtitle: 'Awaiting review', time: '5 hours ago' },
    { icon: '✓', title: 'Bounty "Contract Audit" completed', subtitle: 'Earned 200 USDC', time: '1 day ago' },
    { icon: '⭐', title: 'Received 5-star rating from @bob', subtitle: 'For "API Integration"', time: '2 days ago' },
    { icon: '📋', title: 'Posted new bounty "Dashboard UI"', subtitle: '150 USDC reward', time: '3 days ago' },
  ]

  const quickActions = [
    { href: '/bounties', icon: '◉', label: 'Browse Open Bounties', description: 'Find tasks matching your skills' },
    { href: '/dashboard', icon: '◈', label: 'Manage My Bounties', description: 'Review submissions and payments' },
    { href: '/profile', icon: '◎', label: 'View My Reputation', description: 'Check your dual-reputation stats' },
    { href: '/payroll', icon: '◫', label: 'Start Batch Payroll', description: 'Pay multiple workers at once' },
  ]

  return (
    <div className="min-h-screen bg-deep-void relative overflow-hidden">
      {/* Cursor glow effect */}
      <CursorGlow />

      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-5xl font-black text-foreground mb-2">
              Welcome back, <span className="text-electric-cyan">{user?.displayName || 'Hunter'}</span>
            </h1>
            <p className="text-muted-silver text-lg">Here&apos;s your Algorand work pulse today.</p>
            
            {/* Main CTAs */}
            <div className="flex flex-wrap gap-4 mt-6">
              <Link href="/bounties/create">
                <NeonButton size="lg">Post New Bounty</NeonButton>
              </Link>
              <Link href="/payroll">
                <NeonButton variant="outline" size="lg">Run Batch Payroll</NeonButton>
              </Link>
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi, i) => (
              <GlowingCard 
                key={i} 
                glow={kpi.color as 'cyan' | 'magenta' | 'purple'}
                className="group hover:-translate-y-1 transition-all duration-300 relative"
              >
                {isLoading && (i === 0 || i === 2) ? (
                  <div className="absolute inset-0 bg-deep-void/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-electric-cyan" />
                  </div>
                ) : null}

                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{kpi.icon}</span>
                  <span className="text-xs text-toxic-green bg-toxic-green/20 px-2 py-0.5 rounded">
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-3xl lg:text-4xl font-black text-foreground">{kpi.value}</p>
              </GlowingCard>
            ))}
          </div>

          {/* Dual-Reputation Overview */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* As Poster */}
            <GlowingCard glow="cyan">
              <h3 className="text-electric-cyan font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>◈</span> Reputation as Poster
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-foreground">96%</p>
                  <p className="text-xs text-muted-silver uppercase">On-time Pay</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-foreground">2%</p>
                  <p className="text-xs text-muted-silver uppercase">Disputes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-warning-amber">4.7★</p>
                  <p className="text-xs text-muted-silver uppercase">Avg Rating</p>
                </div>
              </div>
              <div className="h-2 bg-deep-void rounded overflow-hidden">
                <div className="h-full w-[96%] bg-gradient-to-r from-electric-cyan to-toxic-green" />
              </div>
            </GlowingCard>

            {/* As Worker */}
            <GlowingCard glow="magenta">
              <h3 className="text-neon-magenta font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>◎</span> Reputation as Worker
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-foreground">89%</p>
                  <p className="text-xs text-muted-silver uppercase">Accept Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-warning-amber">4.9★</p>
                  <p className="text-xs text-muted-silver uppercase">Avg Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-foreground">12</p>
                  <p className="text-xs text-muted-silver uppercase">Streak</p>
                </div>
              </div>
              <div className="h-2 bg-deep-void rounded overflow-hidden">
                <div className="h-full w-[89%] bg-gradient-to-r from-neon-magenta to-acid-purple" />
              </div>
            </GlowingCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity Feed */}
            <div className="lg:col-span-2">
              <GlowingCard glow="purple">
                <h3 className="text-acid-purple font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>◐</span> Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActions.length > 0 ? recentActions.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="w-10 h-10 rounded-lg bg-deep-void border border-electric-cyan/30 flex items-center justify-center text-lg group-hover:border-electric-cyan transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{item.title}</p>
                        <p className="text-muted-silver text-sm">{item.subtitle}</p>
                      </div>
                      <span className="text-xs text-muted-silver whitespace-nowrap">{item.time}</span>
                    </div>
                  )) : (
                    <p className="text-muted-silver text-center py-8">No recent activity detected on-chain.</p>
                  )}
                </div>
              </GlowingCard>
            </div>

            {/* Quick Actions Panel */}
            <div>
              <GlowingCard glow="cyan">
                <h3 className="text-electric-cyan font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>⚡</span> Quick Actions
                </h3>
                <div className="space-y-3">
                  {quickActions.map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="group p-3 border border-electric-cyan/20 rounded-lg hover:border-electric-cyan hover:bg-electric-cyan/5 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-electric-cyan group-hover:text-neon-magenta transition-colors">{action.icon}</span>
                          <span className="font-bold text-foreground group-hover:text-electric-cyan transition-colors text-sm">{action.label}</span>
                        </div>
                        <p className="text-xs text-muted-silver pl-7">{action.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlowingCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
