'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { mockBounties } from '@/lib/mock-data'
import { NeonButton, NeonInput, GlowingCard, CyberBadge } from '@/components/cyber-ui'

export default function BountiesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [minRep, setMinRep] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'reward' | 'reputation'>('reward')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const categories = ['all', ...new Set(mockBounties.map(b => b.category))]
  const statuses = ['all', 'open', 'in-review', 'completed', 'disputed']
  const repFilters = ['all', '3', '4', '4.5']

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

    if (status !== 'all') {
      result = result.filter(b => b.status === status)
    }

    if (minRep !== 'all') {
      const minRepNum = parseFloat(minRep)
      result = result.filter(b => b.poster.rating >= minRepNum)
    }

    if (sortBy === 'reward') {
      result.sort((a, b) => b.reward - a.reward)
    } else if (sortBy === 'reputation') {
      result.sort((a, b) => b.poster.rating - a.poster.rating)
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [search, category, difficulty, status, minRep, sortBy])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedBounties = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
    setDifficulty('all')
    setStatus('all')
    setMinRep('all')
    setSortBy('reward')
  }

  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-electric-cyan uppercase tracking-widest mb-2">
              Browse Bounties
            </h1>
            <p className="text-muted-silver">Showing {filtered.length} available tasks</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden mt-4 flex items-center gap-2 border border-electric-cyan text-electric-cyan px-4 py-2 hover:bg-electric-cyan/10 transition-colors"
          >
            <span>Filters</span>
            <span>{showFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel */}
          <aside className={`lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <GlowingCard glow="cyan" className="sticky top-24">
              <h2 className="text-electric-cyan font-bold uppercase tracking-widest mb-6 text-sm">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <NeonInput
                  label="Search"
                  placeholder="Search by title or keyword"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status Pills */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-electric-cyan mb-3 uppercase tracking-widest">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        status === s
                          ? 'bg-electric-cyan text-deep-void'
                          : 'border border-electric-cyan/50 text-electric-cyan hover:bg-electric-cyan/20'
                      }`}
                    >
                      {s === 'all' ? 'All' : s.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reputation Filter */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-electric-cyan mb-3 uppercase tracking-widest">Min Poster Rating</label>
                <div className="flex flex-wrap gap-2">
                  {repFilters.map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRep(r)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        minRep === r
                          ? 'bg-neon-magenta text-deep-void'
                          : 'border border-neon-magenta/50 text-neon-magenta hover:bg-neon-magenta/20'
                      }`}
                    >
                      {r === 'all' ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 text-sm focus:outline-none focus:border-electric-cyan transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 text-sm focus:outline-none focus:border-electric-cyan transition-colors"
                >
                  <option value="newest">Newest</option>
                  <option value="reward">Highest Reward</option>
                  <option value="reputation">Highest Poster Reputation</option>
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="text-neon-magenta text-sm hover:underline"
              >
                Reset filters
              </button>
            </GlowingCard>
          </aside>

          {/* Bounty Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedBounties.map((bounty) => (
                <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                  <GlowingCard
                    glow={bounty.reward > 10000 ? 'magenta' : bounty.reward > 5000 ? 'purple' : 'cyan'}
                    className="h-full group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    {/* Animated border glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan via-neon-magenta to-acid-purple animate-border-flow" style={{ backgroundSize: '200% 100%' }} />
                    </div>

                    <div className="relative z-10 bg-charcoal-steel p-4 h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-foreground group-hover:text-electric-cyan transition-colors truncate">
                            {bounty.title}
                          </h3>
                          <p className="text-electric-cyan text-xs font-bold uppercase tracking-widest">
                            {bounty.category}
                          </p>
                        </div>
                        <CyberBadge 
                          variant={
                            bounty.status === 'open' ? 'cyan' : 
                            bounty.status === 'completed' ? 'success' : 
                            bounty.status === 'disputed' ? 'magenta' : 'purple'
                          }
                        >
                          {bounty.status}
                        </CyberBadge>
                      </div>

                      <p className="text-muted-silver text-sm mb-4 line-clamp-2">
                        {bounty.shortDescription}
                      </p>

                      {/* Reward */}
                      <div className="mb-3 p-2 bg-deep-void/50 border border-electric-cyan/30 rounded">
                        <p className="text-xs text-muted-silver mb-1">Reward</p>
                        <p className="text-xl font-black text-neon-magenta">
                          {bounty.reward.toLocaleString()} {bounty.currency}
                        </p>
                        <p className="text-xs text-muted-silver">(Algorand)</p>
                      </div>

                      {/* Poster info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-electric-cyan to-neon-magenta flex items-center justify-center text-xs font-bold text-deep-void">
                          {bounty.poster.displayName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{bounty.poster.displayName}</p>
                          <p className="text-xs text-warning-amber">
                            {'★'.repeat(Math.floor(bounty.poster.rating))} {bounty.poster.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* Time info */}
                      <p className="text-xs text-muted-silver mb-4">
                        {bounty.status === 'open' ? `Closes: ${bounty.deadline}` : `Closed`}
                      </p>

                      {/* CTA */}
                      <NeonButton size="sm" className="w-full">
                        View Details
                      </NeonButton>
                    </div>
                  </GlowingCard>
                </Link>
              ))}
            </div>

            {/* No results */}
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-silver text-xl mb-6">No bounties found</p>
                <Link href="/bounties/create">
                  <NeonButton>Post First Bounty</NeonButton>
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-electric-cyan/50 text-electric-cyan hover:bg-electric-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 font-bold transition-all ${
                      currentPage === page
                        ? 'bg-electric-cyan text-deep-void'
                        : 'border border-electric-cyan/50 text-electric-cyan hover:bg-electric-cyan/20'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-electric-cyan/50 text-electric-cyan hover:bg-electric-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
