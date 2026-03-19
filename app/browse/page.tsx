'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { mockBounties } from '@/lib/mock-data'
import { NeonButton, NeonInput, GlowingCard, CyberBadge } from '@/components/cyber-ui'

export default function BrowsePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'reward' | 'deadline' | 'popular'>('reward')

  const categories = ['all', ...new Set(mockBounties.map(b => b.category))]
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'expert']

  const filtered = useMemo(() => {
    let result = [...mockBounties]

    if (search) {
      result = result.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'all') {
      result = result.filter(b => b.category === category)
    }

    if (difficulty !== 'all') {
      result = result.filter(b => b.difficulty === difficulty)
    }

    if (sortBy === 'reward') {
      result.sort((a, b) => b.reward - a.reward)
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    } else {
      result.sort((a, b) => b.applicants - a.applicants)
    }

    return result
  }, [search, category, difficulty, sortBy])

  return (
    <div className="min-h-screen bg-cyber-dark py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-5xl font-black text-cyber-cyan mb-2 uppercase tracking-widest">
          Browse Bounties
        </h1>
        <p className="text-cyber-light/60 mb-8">Showing {filtered.length} available tasks</p>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <NeonInput
            label="Search"
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-cyber-cyan mb-2 uppercase tracking-widest">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-cyber-dark border-2 border-cyber-cyan text-cyber-light px-3 py-2 focus:outline-none focus:shadow-neon-cyan"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyber-cyan mb-2 uppercase tracking-widest">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-cyber-dark border-2 border-cyber-cyan text-cyber-light px-3 py-2 focus:outline-none focus:shadow-neon-cyan"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyber-cyan mb-2 uppercase tracking-widest">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-cyber-dark border-2 border-cyber-cyan text-cyber-light px-3 py-2 focus:outline-none focus:shadow-neon-cyan"
            >
              <option value="reward">Highest Reward</option>
              <option value="deadline">Earliest Deadline</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Bounty Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((bounty) => (
            <Link key={bounty.id} href={`/bounty/${bounty.id}`}>
              <GlowingCard
                glow={bounty.reward > 10000 ? 'magenta' : bounty.reward > 5000 ? 'purple' : 'cyan'}
                className="h-full group hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-cyber-light group-hover:text-cyber-cyan transition-colors">
                      {bounty.title}
                    </h3>
                    <p className="text-cyber-cyan text-sm font-bold uppercase tracking-widest">
                      {bounty.category}
                    </p>
                  </div>
                  <CyberBadge variant={bounty.difficulty === 'expert' ? 'magenta' : bounty.difficulty === 'advanced' ? 'purple' : 'cyan'}>
                    {bounty.difficulty}
                  </CyberBadge>
                </div>

                <p className="text-cyber-light/70 text-sm mb-4 line-clamp-2">
                  {bounty.shortDescription}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-light/60">Reward:</span>
                    <span className="text-cyber-magenta font-bold">{bounty.reward.toLocaleString()} {bounty.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-light/60">Applicants:</span>
                    <span className="text-cyber-cyan">{bounty.applicants}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-light/60">Deadline:</span>
                    <span className="text-cyber-purple">{bounty.deadline}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-cyber-dark/50 rounded border border-cyber-cyan/30">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-magenta rounded"
                      style={{ width: `${Math.min((bounty.applicants / 25) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </GlowingCard>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-cyber-light/60 text-xl mb-6">No bounties found</p>
            <Link href="/create">
              <NeonButton>
                Post First Bounty
              </NeonButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
