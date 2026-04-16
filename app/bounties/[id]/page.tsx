'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'
import { Loader2 } from 'lucide-react'
import { AlgocredBountyManagerFactory } from '@/contracts/AlgocredBountyManagerClient'
import { CursorGlow } from '@/components/root-layout-client'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAlgorand() {
  return AlgorandClient.fromConfig({
    algodConfig: { server: 'https://testnet-api.algonode.cloud', port: '', token: '' },
    indexerConfig: { server: 'https://testnet-idx.algonode.cloud', port: '', token: '' },
  })
}

function getAppId() {
  return Number(process.env.NEXT_PUBLIC_MANAGER_APP_ID)
}

function getClient(algorand: ReturnType<typeof getAlgorand>, sender: string, signer: algosdk.TransactionSigner) {
  const appId = getAppId()
  const factory = new AlgocredBountyManagerFactory({ algorand, defaultSender: sender, defaultSigner: signer })
  return factory.getAppClientById({ appId: BigInt(appId) })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BountyDetailPage() {
  const params = useParams()
  const { connected, activeAccount, transactionSigner } = useWallet()

  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details')
  const [bounty, setBounty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [payoutInProgress, setPayoutInProgress] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])

  const isOwner = connected && activeAccount?.address === bounty?.posterId

  // ── Fetch bounty + submissions from on-chain ──────────────────────────────
  useEffect(() => {
    async function fetchBounty() {
      const appId = getAppId()
      if (!appId || !params.id) { setLoading(false); return }

      try {
        const algorand = getAlgorand()
        const bountyIdNum = Number(params.id)

        // ── Bounty data ──
        const boxName = algosdk.encodeUint64(bountyIdNum)
        const boxValue = await algorand.client.algod.getApplicationBoxByName(appId, boxName).do()
        const abiType = algosdk.ABIType.from('(uint64,string,string,string,address,string,uint64,uint64,uint64,uint64,uint64)')
        const decoded = abiType.decode(boxValue.value) as any[]

        setBounty({
          id: String(decoded[0]),
          title: String(decoded[1]),
          category: String(decoded[2]),
          description: String(decoded[3]),
          posterId: String(decoded[4]),
          poster: { displayName: String(decoded[4]).substring(0, 8) + '...' },
          imageUrl: String(decoded[5]),
          reward: Number(decoded[6]) / 1e6,
          deadline: new Date(Number(decoded[7]) * 1000).toLocaleDateString(),
          applicants: Number(decoded[8]),
        })

        // ── Submissions from on-chain boxes ──
        const boxResponse = await algorand.client.algod.getApplicationBoxes(appId).do()
        const boxes = boxResponse.boxes || []

        // The box key for a submission is: "submissions" (11 bytes) + bountyId (8 bytes) + hunterPublicKey (32 bytes)
        const submissionPrefixStr = 'submissions'
        const submissionPrefixBytes = new TextEncoder().encode(submissionPrefixStr)
        const bountyIdBytes = algosdk.encodeUint64(bountyIdNum)

        // Build the prefix we filter on: "submissions" + bountyId
        const filterPrefix = new Uint8Array(submissionPrefixBytes.length + bountyIdBytes.length)
        filterPrefix.set(submissionPrefixBytes)
        filterPrefix.set(bountyIdBytes, submissionPrefixBytes.length)

        const subs: any[] = []
        const submissionAbiType = algosdk.ABIType.from('(address,uint64,string,string,uint64)')

        for (const box of boxes) {
          const name = box.name // Uint8Array
          if (name.length < filterPrefix.length) continue
          let match = true
          for (let i = 0; i < filterPrefix.length; i++) {
            if (name[i] !== filterPrefix[i]) { match = false; break }
          }
          if (!match) continue
          try {
            const content = await algorand.client.algod.getApplicationBoxByName(appId, name).do()
            const decodedSub = submissionAbiType.decode(content.value) as any[]
            subs.push({
              hunter_address: String(decodedSub[0]),
              submission_text: String(decodedSub[2]),
              submission_url: String(decodedSub[3]),
              submittedAt: Number(decodedSub[4]),
            })
          } catch { /* skip malformed box */ }
        }
        setSubmissions(subs)

      } catch (err) {
        console.error('Fetch Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBounty()
  }, [params.id, connected])

  // ── Pay out winner ────────────────────────────────────────────────────────
  const handlePayout = async (winner: string, amount: number) => {
    if (!activeAccount?.address || !transactionSigner) {
      alert('Please connect your wallet first.')
      return
    }
    setPayoutInProgress(true)
    try {
      const algorand = getAlgorand()
      const appId = getAppId()
      const client = getClient(algorand, activeAccount.address, transactionSigner)

      await client.send.payBounty({
        args: {
          bountyId: Number(params.id),
          developer: winner,
          payoutAmount: Math.floor(amount * 1e6),
        },
        boxReferences: [{ appId: BigInt(appId), name: algosdk.encodeUint64(Number(params.id)) }],
      })
      alert('Payout Successful!')
    } catch (e) {
      console.error(e)
      alert('Payout failed. Check console.')
    } finally {
      setPayoutInProgress(false)
    }
  }

  // ── Submit work on-chain ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!activeAccount?.address || !transactionSigner) {
      alert('Please connect your wallet first.')
      return
    }
    setSubmitting(true)
    try {
      const url = (document.getElementById('sub-url') as HTMLInputElement).value.trim()
      const text = (document.getElementById('sub-text') as HTMLTextAreaElement).value.trim()
      if (!text) { alert('Please enter a work description.'); setSubmitting(false); return }

      const algorand = getAlgorand()
      const appId = getAppId()
      const client = getClient(algorand, activeAccount.address, transactionSigner)

      // The TEALScript contract was compiled without a BoxMap prefix, so the key length is exactly 40 bytes.
      // Box value = address (32) + uint64 (8) + string (2+text) + string (2+url) + uint64 (8) bytes
      const baseMBR = 2500
      const keyLen = 40
      const valueLen = 32 + 8 + 2 + text.length + 2 + url.length + 8
      const totalMBR = baseMBR + 400 * (keyLen + valueLen)

      // ── Build box key for reference ──
      // The box key is just bountyId (8 bytes) + hunterPK (32 bytes)
      const bountyIdBytes = algosdk.encodeUint64(Number(params.id))
      const hunterPKBytes = algosdk.decodeAddress(activeAccount.address).publicKey
      const subKey = new Uint8Array(bountyIdBytes.length + hunterPKBytes.length)
      subKey.set(bountyIdBytes)
      subKey.set(hunterPKBytes, bountyIdBytes.length)

      // ── Build MBR payment transaction (do NOT send yet) ──
      // algosdk v3 removed the positional-arg form. Use the object-arg form which still exists in v3.
      const suggestedParams = await algorand.client.algod.getTransactionParams().do()
      const mbrPaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAccount.address,
        receiver: algosdk.getApplicationAddress(appId),
        amount: totalMBR,
        suggestedParams,
      })

      // ── Call submitWork ──
      // The AppClient will compose the payment transaction with the app call in a group
      await client.send.submitWork({
        args: {
          mbrPayment: mbrPaymentTxn,
          bountyId: Number(params.id),
          text,
          url,
        },
        boxReferences: [
          { appId: BigInt(appId), name: subKey },
          { appId: BigInt(appId), name: bountyIdBytes },
        ],
      })

      setSubmitted(true)
      setTimeout(() => { setShowSubmitModal(false); setSubmitted(false) }, 2500)
    } catch (e: any) {
      console.error(e)
      alert(`Submission failed: ${e?.message ?? 'Check console for details.'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center p-4">
      <Loader2 className="w-12 h-12 animate-spin text-electric-cyan mb-4" />
      <p className="text-xl font-bold text-electric-cyan uppercase tracking-widest">Syncing Matrix...</p>
    </div>
  )

  if (!bounty) return (
    <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center p-4">
      <p className="text-xl text-neon-magenta font-bold">Bounty not found on-chain.</p>
      <Link href="/bounties" className="text-electric-cyan mt-4">← Back to Feed</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8 relative">
      <CursorGlow />
      <div className="max-w-6xl mx-auto relative z-10">
        <Link href="/bounties" className="text-muted-silver hover:text-electric-cyan mb-6 inline-block">← Back to Feed</Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">
            <GlowingCard glow="cyan">
              <div className="flex gap-2 mb-4">
                <CyberBadge variant="cyan">{bounty.category}</CyberBadge>
                <CyberBadge variant="success">Open</CyberBadge>
              </div>
              <h1 className="text-3xl font-black text-foreground mb-6">{bounty.title}</h1>

              <div className="flex gap-8 mb-8 py-4 border-y border-electric-cyan/10 text-sm">
                <div>
                  <p className="text-muted-silver uppercase">Posted By</p>
                  <p className="font-bold text-foreground font-mono text-xs">{bounty.poster.displayName}</p>
                </div>
                <div>
                  <p className="text-muted-silver uppercase">Deadline</p>
                  <p className="font-bold text-neon-magenta">{bounty.deadline}</p>
                </div>
              </div>

              {/* Owner tab switcher */}
              {isOwner && (
                <div className="flex gap-6 mb-6 border-b border-electric-cyan/20">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-3 font-bold uppercase tracking-widest text-xs ${activeTab === 'details' ? 'text-electric-cyan border-b-2 border-electric-cyan' : 'text-muted-silver'}`}
                  >Details</button>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`pb-3 font-bold uppercase tracking-widest text-xs ${activeTab === 'submissions' ? 'text-neon-magenta border-b-2 border-neon-magenta' : 'text-muted-silver'}`}
                  >Submissions ({submissions.length})</button>
                </div>
              )}

              {activeTab === 'details' ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-silver whitespace-pre-wrap">{bounty.description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.length === 0 && (
                    <p className="text-muted-silver text-sm text-center py-8">No submissions yet.</p>
                  )}
                  {submissions.map((s, i) => (
                    <div key={i} className="p-4 bg-deep-void/50 border border-electric-cyan/20 rounded flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-electric-cyan font-mono truncate mb-1">{s.hunter_address}</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{s.submission_text}</p>
                        {s.submission_url && (
                          <a href={s.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-acid-purple underline mt-1 block truncate">
                            {s.submission_url}
                          </a>
                        )}
                      </div>
                      <NeonButton size="sm" onClick={() => handlePayout(s.hunter_address, bounty.reward)} loading={payoutInProgress}>
                        Payout
                      </NeonButton>
                    </div>
                  ))}
                </div>
              )}
            </GlowingCard>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <GlowingCard glow="magenta" className="text-center">
              <p className="text-xs text-muted-silver uppercase mb-1">Reward</p>
              <p className="text-4xl font-black text-foreground mb-6">{bounty.reward} ALGO</p>
              {!isOwner && (
                <div className="space-y-3">
                  <NeonButton className="w-full" onClick={() => setShowSubmitModal(true)}>Submit Work</NeonButton>
                  <NeonButton variant="outline" className="w-full" onClick={() => {
                    const saved = JSON.parse(localStorage.getItem('saved_bounties') || '[]')
                    if (!saved.includes(params.id)) {
                      saved.push(params.id)
                      localStorage.setItem('saved_bounties', JSON.stringify(saved))
                      alert('Bounty Saved!')
                    } else {
                      alert('Already saved!')
                    }
                  }}>Save for Later</NeonButton>
                </div>
              )}
            </GlowingCard>

            <GlowingCard glow="cyan">
              <h3 className="text-electric-cyan font-bold uppercase tracking-widest mb-4 text-sm">Quick Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-silver uppercase mb-1">Posted By</p>
                  <p className="font-bold text-foreground text-xs truncate">{bounty.posterId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase mb-1">Applicants</p>
                  <p className="font-bold text-foreground">{bounty.applicants}</p>
                </div>
              </div>
            </GlowingCard>

            <GlowingCard glow="purple">
              <h3 className="text-acid-purple font-bold uppercase tracking-widest mb-3 text-sm">Share</h3>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!') }}
                className="text-electric-cyan hover:text-neon-magenta text-sm transition-colors uppercase font-bold tracking-tighter"
              >
                [ Copy Magic Link ]
              </button>
            </GlowingCard>
          </div>
        </div>
      </div>

      {/* ── Submit Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deep-void/90 backdrop-blur-sm" onClick={() => !submitting && setShowSubmitModal(false)} />
          <div className="relative w-full max-w-lg">
            <GlowingCard glow="cyan">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-black text-toxic-green mb-2">Submission Recorded On-Chain!</h2>
                  <p className="text-muted-silver">The bounty poster will review your work shortly.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-electric-cyan mb-1">Submit Your Work</h2>
                  <p className="text-xs text-muted-silver mb-4">A small ALGO fee will be charged to store your submission on-chain.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">
                        Work Description
                      </label>
                      <textarea
                        id="sub-text"
                        className="w-full h-24 bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors resize-none"
                        placeholder="Describe what you've completed..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">
                        Proof / Link
                      </label>
                      <input
                        id="sub-url"
                        type="text"
                        className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                        placeholder="GitHub repo, demo link, etc."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <NeonButton variant="outline" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                      Cancel
                    </NeonButton>
                    <NeonButton className="flex-1" onClick={handleSubmit} loading={submitting}>
                      {submitting ? 'Signing & Submitting...' : 'Submit Work On-Chain'}
                    </NeonButton>
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
