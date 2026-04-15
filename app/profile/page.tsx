'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { Loader2 } from 'lucide-react'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'

export default function ProfilePage() {
  const { connected, user, walletAddress, activeAccount } = useWallet()
  const [activeTab, setActiveTab] = useState<'poster' | 'worker'>('poster')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    posted: 0,
    completed: 0,
    paid: 0,
    earned: 0,
    rating: 4.8
  })
  const [recentActions, setRecentActions] = useState<any[]>([])

  useEffect(() => {
    async function fetchProfileData() {
      if (!activeAccount || !process.env.NEXT_PUBLIC_MANAGER_APP_ID) {
        setLoading(false)
        return
      }

      try {
        const algorand = AlgorandClient.fromConfig({
          algodConfig: { server: "https://testnet-api.algonode.cloud", port: "", token: "" },
          indexerConfig: { server: "https://testnet-idx.algonode.cloud", port: "", token: "" },
        })
        const appId = Number(process.env.NEXT_PUBLIC_MANAGER_APP_ID)

        const boxResponse = await algorand.client.indexer.searchForApplicationBoxes(appId).do()
        const abiType = algosdk.ABIType.from('(uint64,string,string,string,address,string,uint64,uint64,uint64,uint64,uint64)')

        let postedCount = 0
        let totalPaid = 0
        const activities: any[] = []

        for (const box of boxResponse.boxes) {
          try {
            const boxValue = await algorand.client.algod.getApplicationBoxByName(appId, box.name).do()
            if (box.name.length === 8) {
              const decoded = abiType.decode(boxValue.value) as any[]
              if (decoded[4] === activeAccount.address) {
                postedCount++
                totalPaid += Number(decoded[6]) / 1e6
                activities.push({
                  icon: '◉',
                  title: `Posted: ${decoded[1]}`,
                  detail: `Reward: ${Number(decoded[6]) / 1e6} ALGO`,
                  date: 'On-chain'
                })
              }
            } else if (box.name.length === 32) {
              const boxAddr = algosdk.encodeAddress(box.name)
              if (boxAddr === activeAccount.address) {
                const rep = Number(algosdk.decodeUint64(boxValue.value))
                setStats(s => ({ ...s, completed: rep, rating: 4.8 + (rep * 0.1 > 0.2 ? 0.2 : 0) }))
                activities.push({
                  icon: '⭐',
                  title: 'Reputation Milestone',
                  detail: `Current Score: ${rep}`,
                  date: 'Live'
                })
              }
            }
          } catch (e) { }
        }

        setStats(s => ({
          ...s,
          posted: postedCount,
          paid: totalPaid,
        }))
        setRecentActions(activities.slice(0, 5))

      } catch (err) {
        console.error("Profile fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [activeAccount])

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress || 'ALGO...')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
        <GlowingCard glow="magenta" className="max-w-md">
          <h1 className="text-2xl font-black text-neon-magenta mb-4">Profile Access</h1>
          <p className="text-muted-silver mb-6">Connect your Algorand wallet to view your profile.</p>
          <Link href="/dashboard" className="text-electric-cyan hover:text-neon-magenta transition-colors">
            ← Back to Dashboard
          </Link>
        </GlowingCard>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Bounties Posted', value: stats.posted.toString(), icon: '◉' },
    { label: 'Total Bounties Won', value: stats.completed.toString(), icon: '✓' },
    { label: 'On-Time Payment %', value: '100%', icon: '⏱' },
    { label: 'Trust Score', value: stats.rating.toFixed(1), icon: '📈' },
    { label: 'Total Earned', value: `${stats.earned} ALGO`, icon: '💰' },
    { label: 'Total Paid Out', value: `${stats.paid} ALGO`, icon: '💸' },
  ]

  const posterReviews = [
    { from: '@alice', role: 'Worker', rating: 5, comment: 'Great communicator, paid immediately!' },
    { from: '@bob_dev', role: 'Worker', rating: 5, comment: 'Clear requirements, fair pay.' },
    { from: '@cyber_ninja', role: 'Worker', rating: 4, comment: 'Good experience overall.' },
  ]

  const workerReviews = [
    { from: '@tech_corp', role: 'Poster', rating: 5, comment: 'Excellent work, exceeded expectations!' },
    { from: '@startup_io', role: 'Poster', rating: 5, comment: 'Fast delivery, clean code.' },
    { from: '@defi_labs', role: 'Poster', rating: 4, comment: 'Good quality, would hire again.' },
  ]

  const timeline = [
    { icon: '💰', title: 'Paid 75 USDC to @bob', detail: 'For "Indexer API" – Rated 5★', date: '2 hours ago' },
    { icon: '✓', title: 'Completed "Logo Design"', detail: 'For @carol – Rated 4★', date: '1 day ago' },
    { icon: '📤', title: 'Submitted work', detail: 'For "Smart Contract Audit"', date: '2 days ago' },
    { icon: '◉', title: 'Posted new bounty', detail: '"Dashboard UI" – 150 USDC', date: '3 days ago' },
    { icon: '⭐', title: 'Received 5-star rating', detail: 'From @tech_corp', date: '5 days ago' },
  ]

  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <GlowingCard glow="cyan" className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Avatar & Info */}
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg bg-gradient-to-br from-electric-cyan via-neon-magenta to-acid-purple flex items-center justify-center text-4xl font-black text-deep-void">
                {(user?.displayName || 'U').charAt(0)}
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-foreground mb-1">
                  {user?.displayName || 'Anonymous Hunter'}
                </h1>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 text-muted-silver hover:text-electric-cyan transition-colors group"
                >
                  <span className="font-mono text-sm">{walletAddress || 'ALGO...MOCK1234'}</span>
                  <span className="text-xs">{copied ? '✓ Copied!' : '📋'}</span>
                </button>
                <p className="text-muted-silver text-sm mt-2">On Algorand since 2024</p>
              </div>
            </div>

            {/* Right: Rating & Badges */}
            <div className="flex flex-col items-start lg:items-end gap-2 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-deep-void/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-electric-cyan" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-warning-amber">{stats.rating}</span>
                <span className="text-warning-amber text-2xl">★</span>
              </div>
              <div className="flex gap-2">
                <CyberBadge variant="cyan">Poster</CyberBadge>
                <CyberBadge variant="magenta">Worker</CyberBadge>
                <CyberBadge variant="success">Verified</CyberBadge>
              </div>
            </div>
          </div>
        </GlowingCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <GlowingCard
              key={i}
              glow={i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'magenta' : 'purple'}
              className="group hover:-translate-y-1 transition-all relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-deep-void/20 backdrop-blur-sm z-10">
                  <Loader2 className="w-4 h-4 animate-spin text-electric-cyan" />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground group-hover:text-electric-cyan transition-colors">
                {stat.value}
              </p>
            </GlowingCard>
          ))}
        </div>

        {/* Reputation Breakdown */}
        <GlowingCard glow="purple" className="mb-8">
          <h2 className="text-acid-purple font-bold uppercase tracking-widest mb-6">Reputation Breakdown</h2>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-electric-cyan/20">
            <button
              onClick={() => setActiveTab('poster')}
              className={`px-4 py-3 font-bold text-sm uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'poster'
                  ? 'text-electric-cyan border-electric-cyan'
                  : 'text-muted-silver border-transparent hover:text-foreground'
                }`}
            >
              As Poster
            </button>
            <button
              onClick={() => setActiveTab('worker')}
              className={`px-4 py-3 font-bold text-sm uppercase tracking-widest transition-all border-b-2 -mb-px ${activeTab === 'worker'
                  ? 'text-neon-magenta border-neon-magenta'
                  : 'text-muted-silver border-transparent hover:text-foreground'
                }`}
            >
              As Worker
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Summary & Chart placeholder */}
            <div>
              <p className="text-muted-silver mb-4">
                {activeTab === 'poster'
                  ? 'Your reputation as a bounty poster reflects how you treat workers: timely payments, clear communication, and fair ratings.'
                  : 'Your reputation as a worker reflects your quality of work, timeliness, and professionalism.'}
              </p>

              {/* Placeholder chart */}
              <div className="h-40 bg-deep-void/50 border border-electric-cyan/20 rounded-lg flex items-end justify-around p-4">
                {[4.2, 4.5, 4.3, 4.8, 4.6, 4.9].map((rating, i) => (
                  <div
                    key={i}
                    className={`w-8 rounded-t transition-all ${activeTab === 'poster' ? 'bg-electric-cyan' : 'bg-neon-magenta'}`}
                    style={{ height: `${(rating / 5) * 100}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-silver text-center mt-2">Ratings over time (mock data)</p>
            </div>

            {/* Recent Reviews */}
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {(activeTab === 'poster' ? posterReviews : workerReviews).map((review, i) => (
                  <div key={i} className="border-l-2 border-electric-cyan/50 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-foreground">{review.from}</span>
                      <span className="text-warning-amber text-sm">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="text-xs text-muted-silver mb-1">{review.role}</p>
                    <p className="text-sm text-muted-silver">&ldquo;{review.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlowingCard>

        {/* Activity Timeline */}
        <GlowingCard glow="cyan">
          <h2 className="text-electric-cyan font-bold uppercase tracking-widest mb-6">Activity Timeline</h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-electric-cyan/30" />

            <div className="space-y-6">
              {recentActions.length > 0 ? recentActions.map((item, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  {/* Node */}
                  <div className="w-10 h-10 rounded-lg bg-deep-void border border-electric-cyan/50 flex items-center justify-center text-lg z-10">
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p className="text-foreground font-medium">{item.title}</p>
                    <p className="text-muted-silver text-sm">{item.detail}</p>
                  </div>

                  {/* Date */}
                  <span className="text-xs text-muted-silver whitespace-nowrap pt-1">{item.date}</span>
                </div>
              )) : (
                <p className="text-muted-silver text-center py-8">No on-chain activity detected yet.</p>
              )}
            </div>
          </div>
        </GlowingCard>
      </div>
    </div>
  )
}
