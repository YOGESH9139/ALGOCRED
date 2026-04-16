'use client'

import React, { useState } from 'react'
import { useModal } from '@/lib/modal-context'
import { useWallet } from '@/lib/wallet-context'
import { NeonButton, NeonInput, GlowingCard, CyberBadge } from '@/components/cyber-ui'

export function ModalSystem() {
  const { activeModal, modalData, closeModal } = useModal()
  const { setBalance } = useWallet()
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState('')

  if (!activeModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-dark/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        {/* Wallet Modal */}
        {activeModal === 'wallet' && (
          <GlowingCard glow="cyan">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyber-cyan uppercase tracking-widest">Wallet</h2>
              <button onClick={closeModal} className="text-cyber-light/60 hover:text-cyber-light">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-cyber-dark/50 p-4 rounded border border-cyber-cyan/30">
                <p className="text-cyber-light/60 text-xs uppercase tracking-widest mb-2">Address</p>
                <p className="text-cyber-light font-mono text-sm break-all">0x742d35Cc6634C0532925a3b844Bc123E65eB4D</p>
              </div>

              <div className="bg-cyber-dark/50 p-4 rounded border border-cyber-cyan/30">
                <p className="text-cyber-light/60 text-xs uppercase tracking-widest mb-2">Network</p>
                <p className="text-cyber-light">Ethereum Mainnet</p>
              </div>

              <NeonInput
                label="Amount to Deposit"
                type="number"
                step="0.01"
                placeholder="0.5"
              />

              <div className="flex gap-2">
                <NeonButton className="flex-1">Deposit ETH</NeonButton>
                <NeonButton variant="outline" className="flex-1">Copy Address</NeonButton>
              </div>
            </div>
          </GlowingCard>
        )}


        {/* Rating Modal */}
        {activeModal === 'rating' && (
          <GlowingCard glow="purple">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyber-purple uppercase tracking-widest">Rate Worker</h2>
              <button onClick={closeModal} className="text-cyber-light/60 hover:text-cyber-light">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-cyber-light/60 text-xs uppercase tracking-widest mb-2">Worker</p>
                <p className="text-cyber-light font-bold">{modalData.submission?.hunter?.displayName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyber-cyan mb-3 uppercase tracking-widest">Rating</label>
                <div className="flex gap-2 text-3xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`transition-all ${star <= rating ? 'text-cyber-magenta scale-110' : 'text-cyber-light/30'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyber-cyan mb-2 uppercase tracking-widest">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience working with this person..."
                  className="w-full bg-cyber-dark border-2 border-cyber-cyan text-cyber-light placeholder-cyber-cyan/50 px-3 py-2 focus:outline-none focus:shadow-neon-cyan transition-all h-20 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <NeonButton className="flex-1">Submit Rating</NeonButton>
                <NeonButton variant="outline" onClick={closeModal}>Cancel</NeonButton>
              </div>
            </div>
          </GlowingCard>
        )}

        {/* Confirm Action Modal */}
        {activeModal === 'confirm-action' && (
          <GlowingCard glow="magenta">
            <h2 className="text-2xl font-bold text-cyber-magenta mb-4 uppercase tracking-widest">
              {modalData.action?.title}
            </h2>
            <p className="text-cyber-light/80 mb-6">{modalData.action?.message}</p>
            <div className="flex gap-2">
              <NeonButton
                className="flex-1"
                onClick={() => {
                  modalData.action?.onConfirm()
                  closeModal()
                }}
              >
                {modalData.action?.confirmText || 'Confirm'}
              </NeonButton>
              <NeonButton variant="outline" onClick={closeModal} className="flex-1">
                Cancel
              </NeonButton>
            </div>
          </GlowingCard>
        )}
      </div>
    </div>
  )
}
