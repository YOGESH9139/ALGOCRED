'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { mockBounties } from '@/lib/mock-data'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'

export default function BountyDetailPage() {
  const params = useParams()
  const { connected } = useWallet()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const bounty = mockBounties.find(b => b.id === params.id) || mockBounties[0]
  const bountySubmissions = bounty?.submissions || []

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 2000))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      setShowSubmitModal(false)
      setSubmitted(false)
    }, 2000)
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
        <GlowingCard glow="magenta" className="max-w-md">
          <h1 className="text-2xl font-black text-neon-magenta mb-4">Bounty Not Found</h1>
          <p className="text-muted-silver mb-6">This bounty doesn&apos;t exist or has been removed.</p>
          <Link href="/bounties" className="text-electric-cyan hover:text-neon-magenta transition-colors">
            ← Browse Bounties
          </Link>
        </GlowingCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/bounties" className="inline-flex items-center gap-2 text-electric-cyan hover:text-neon-magenta transition-colors mb-6">
          ← Back to Bounties
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlowingCard glow="cyan">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-2">{bounty.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <CyberBadge variant="cyan">{bounty.category}</CyberBadge>
                    <CyberBadge variant={bounty.difficulty === 'expert' ? 'magenta' : bounty.difficulty === 'advanced' ? 'purple' : 'cyan'}>
                      {bounty.difficulty}
                    </CyberBadge>
                    <CyberBadge variant={bounty.status === 'open' ? 'success' : 'purple'}>
                      {bounty.status}
                    </CyberBadge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-neon-magenta">{bounty.reward.toLocaleString()} {bounty.currency}</p>
                  <p className="text-muted-silver text-sm">on Algorand</p>
                </div>
              </div>
              <p className="text-muted-silver mb-6">{bounty.description}</p>
              {bounty.requirements && (
                <div>
                  <h3 className="text-electric-cyan font-bold uppercase tracking-widest text-sm mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {bounty.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground">
                        <span className="text-electric-cyan mt-1">◆</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlowingCard>

            <GlowingCard glow="purple">
              <h2 className="text-acid-purple font-bold uppercase tracking-widest mb-4">
                Submissions ({bountySubmissions.length})
              </h2>
              {bountySubmissions.length > 0 ? (
                <div className="space-y-4">
                  {bountySubmissions.map((sub) => (
                    <div key={sub.id} className="border-l-2 border-electric-cyan/50 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-foreground">{sub.hunter.displayName}</span>
                        <span className="text-xs text-muted-silver">{sub.submittedAt}</span>
                      </div>
                      <p className="text-muted-silver text-sm mb-2">{sub.description}</p>
                      <CyberBadge variant={sub.status === 'approved' ? 'success' : sub.status === 'pending' ? 'cyan' : 'magenta'}>
                        {sub.status}
                      </CyberBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-silver">No submissions yet. Be the first!</p>
              )}
            </GlowingCard>
          </div>

          <div className="space-y-6">
            <GlowingCard glow="cyan">
              <h3 className="text-electric-cyan font-bold uppercase tracking-widest mb-4 text-sm">Quick Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-silver uppercase mb-1">Posted by</p>
                  <p className="text-foreground font-bold">{bounty.poster.displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase mb-1">Deadline</p>
                  <p className="text-foreground font-bold">{bounty.deadline}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase mb-1">Applicants</p>
                  <p className="text-foreground font-bold">{bounty.applicants}</p>
                </div>
              </div>
            </GlowingCard>

            <GlowingCard glow="magenta">
              {connected ? (
                <div className="space-y-3">
                  <NeonButton className="w-full" onClick={() => setShowSubmitModal(true)}>
                    Submit Work
                  </NeonButton>
                  <NeonButton variant="outline" className="w-full">
                    Save for Later
                  </NeonButton>
                </div>
              ) : (
                <div>
                  <p className="text-muted-silver text-sm mb-4">Connect your wallet to submit work</p>
                  <NeonButton className="w-full" disabled>Connect Wallet First</NeonButton>
                </div>
              )}
            </GlowingCard>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-void/90 backdrop-blur-sm" onClick={() => !submitting && setShowSubmitModal(false)} />
          <div className="relative w-full max-w-lg">
            <GlowingCard glow="cyan">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4 text-toxic-green">✓</div>
                  <h2 className="text-2xl font-black text-toxic-green mb-2">Submission Received!</h2>
                  <p className="text-muted-silver">The poster will review your work shortly.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-electric-cyan mb-4">Submit Your Work</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Work Description</label>
                      <textarea
                        className="w-full h-24 bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors resize-none"
                        placeholder="Describe what you've completed..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Proof / Link</label>
                      <input
                        type="text"
                        className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                        placeholder="GitHub repo, demo link, etc."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <NeonButton variant="outline" onClick={() => setShowSubmitModal(false)} disabled={submitting}>Cancel</NeonButton>
                    <NeonButton className="flex-1" onClick={handleSubmit} loading={submitting}>Submit Work</NeonButton>
                  </div>
                </>
              )}
            </GlowingCard>
          </div>
        </div>
      )}
    </div>
  )
}
