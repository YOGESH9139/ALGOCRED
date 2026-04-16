'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import algosdk from 'algosdk'
import { useWallet } from '@/lib/wallet-context'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const ALGOD_SERVER   = 'https://testnet-api.algonode.cloud'
const ALGOD_PORT     = ''
const ALGOD_TOKEN    = ''
const ALGO_EXPLORER  = 'https://testnet.explorer.perawallet.app/tx'
const MAX_BATCH_SIZE = 16       // Algorand max txns per atomic group
const NOTE_TEXT      = 'AlgoCred Payroll'

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
interface PayrollRow {
  id: string
  address: string
  amount: number          // in ALGO
  note: string
  type: string
  status: 'valid' | 'invalid'
  error?: string
}

interface BatchResult {
  batchIndex: number
  txIds: string[]
  status: 'pending' | 'success' | 'error'
  error?: string
  recipientCount: number
  totalAmount: number
}

type ProcessStep = 'building' | 'signing' | 'submitting' | 'done' | null

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
function isValidAlgorandAddress(addr: string): boolean {
  try {
    return algosdk.isValidAddress(addr)
  } catch {
    return false
  }
}

function validateRow(row: Omit<PayrollRow, 'status' | 'error'>): Pick<PayrollRow, 'status' | 'error'> {
  if (!isValidAlgorandAddress(row.address)) {
    return { status: 'invalid', error: 'Invalid Algorand address (must be 58-char base32)' }
  }
  if (!row.amount || row.amount <= 0) {
    return { status: 'invalid', error: 'Amount must be > 0 ALGO' }
  }
  if (row.amount < 0.001) {
    return { status: 'invalid', error: 'Minimum is 0.001 ALGO' }
  }
  return { status: 'valid' }
}

function newRow(overrides: Partial<PayrollRow> = {}): PayrollRow {
  const base = {
    id: Math.random().toString(36).slice(2),
    address: '',
    amount: 0,
    note: NOTE_TEXT,
    type: 'salary',
    ...overrides,
  }
  return { ...base, ...validateRow(base) }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function BatchPayrollPage() {
  const { connected, walletAddress, transactionSigner } = useWallet()

  // ── Data ──────────────────────────────────────────────────
  const [rows, setRows] = useState<PayrollRow[]>([])
  const [inputMode, setInputMode] = useState<'table' | 'csv'>('table')
  const [isDragOver, setIsDragOver] = useState(false)
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)

  // ── Process ───────────────────────────────────────────────
  const [processStep, setProcessStep] = useState<ProcessStep>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived ───────────────────────────────────────────────
  const validRows   = rows.filter(r => r.status === 'valid')
  const invalidRows = rows.filter(r => r.status === 'invalid')
  const totalAlgo   = validRows.reduce((s, r) => s + r.amount, 0)
  const batches     = chunkArray(validRows, MAX_BATCH_SIZE)
  const isProcessing = processStep !== null && processStep !== 'done'

  // ─────────────────────────────────────────────────────────
  //  Row editing
  // ─────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, field: string, value: string | number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      const validation = validateRow(updated)
      return { ...updated, ...validation }
    }))
    setEditingCell(null)
  }, [])

  const addRow = () => setRows(prev => [...prev, newRow()])

  const deleteRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id))

  // ─────────────────────────────────────────────────────────
  //  CSV parsing
  // ─────────────────────────────────────────────────────────
  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return

    // Detect header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const addrIdx   = headers.findIndex(h => h.includes('address') || h === 'addr')
    const amtIdx    = headers.findIndex(h => h.includes('amount') || h === 'amt')
    const noteIdx   = headers.findIndex(h => h.includes('note') || h.includes('memo'))
    const typeIdx   = headers.findIndex(h => h.includes('type') || h.includes('category'))

    if (addrIdx === -1 || amtIdx === -1) {
      setErrorMsg('CSV must have "address" and "amount" columns')
      return
    }

    const parsed: PayrollRow[] = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const addr   = cols[addrIdx]  || ''
      const amt    = parseFloat(cols[amtIdx] || '0')
      const note   = noteIdx  >= 0 ? cols[noteIdx]  : NOTE_TEXT
      const type   = typeIdx  >= 0 ? cols[typeIdx]  : 'salary'
      const base   = { id: Math.random().toString(36).slice(2), address: addr, amount: amt, note, type }
      return { ...base, ...validateRow(base) }
    }).filter(r => r.address || r.amount)   // skip empty lines

    setRows(parsed)
    setInputMode('table')
    setErrorMsg(null)
  }

  const handleFileLoad = (file: File) => {
    if (!file.name.endsWith('.csv')) { setErrorMsg('Please upload a .csv file'); return }
    const reader = new FileReader()
    reader.onload = e => parseCSV(e.target?.result as string)
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileLoad(file)
  }

  // ─────────────────────────────────────────────────────────
  //  Transaction builder & signer (real Algorand atomic groups)
  // ─────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!walletAddress || !transactionSigner || validRows.length === 0) return
    setErrorMsg(null)
    setBatchResults([])
    setProcessStep('building')

    try {
      // 1. Fetch suggested params once
      setProcessStep('building')
      const sp = await algodClient.getTransactionParams().do()
      const note = new TextEncoder().encode(NOTE_TEXT)

      // 2. Build batches (max 16 per atomic group)
      const batchChunks = chunkArray(validRows, MAX_BATCH_SIZE)

      // Initialise results
      setBatchResults(batchChunks.map((chunk, i) => ({
        batchIndex: i + 1,
        txIds: [],
        status: 'pending',
        recipientCount: chunk.length,
        totalAmount: chunk.reduce((s, r) => s + r.amount, 0),
      })))

      setProcessStep('signing')

      for (let bi = 0; bi < batchChunks.length; bi++) {
        const chunk = batchChunks[bi]

        // Build payment txns for each recipient in this batch
        const txns = chunk.map(row =>
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: walletAddress,
            receiver: row.address,
            amount: BigInt(Math.round(row.amount * 1_000_000)),   // microALGO
            suggestedParams: sp,
            note,
          })
        )

        // Assign atomic group ID to the entire batch
        if (txns.length > 1) {
          algosdk.assignGroupID(txns)
        }

        // Sign with connected wallet
        const indices = txns.map((_, i) => i)
        const signedTxns = await transactionSigner(txns, indices)

        setProcessStep('submitting')

        // Submit to algod
        const { txid } = await algodClient.sendRawTransaction(signedTxns).do()

        // Wait for confirmation
        await algosdk.waitForConfirmation(algodClient, txid, 4)

        setBatchResults(prev => prev.map((b, i) =>
          i === bi
            ? { ...b, status: 'success', txIds: [txid] }
            : b
        ))
      }

      setProcessStep('done')
    } catch (err: any) {
      console.error('Payroll error:', err)
      setErrorMsg(err?.message || 'Transaction failed. Check console for details.')
      setBatchResults(prev => prev.map(b =>
        b.status === 'pending' ? { ...b, status: 'error', error: err?.message } : b
      ))
      setProcessStep(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Wallet guard
  // ─────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
        <GlowingCard glow="magenta" className="max-w-md text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-black text-neon-magenta mb-4">Wallet Required</h1>
          <p className="text-muted-silver mb-6">
            Connect your Algorand wallet to use Batch Payroll.
          </p>
          <Link href="/dashboard" className="text-electric-cyan hover:text-neon-magenta transition-colors">
            ← Back to Dashboard
          </Link>
        </GlowingCard>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚡</span>
            <h1 className="text-4xl lg:text-5xl font-black text-electric-cyan uppercase tracking-widest">
              Batch Payroll
            </h1>
          </div>
          <p className="text-muted-silver max-w-2xl">
            Pay multiple Algorand addresses in a single <strong className="text-electric-cyan">atomic transaction group</strong>.  
            All payments in a batch succeed or fail together — guaranteed by the Algorand protocol.
          </p>

          {/* Atomic Group Info */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🔗', title: 'Atomic Groups', desc: 'Up to 16 txns per group, all confirmed together' },
              { icon: '⛓', title: 'Group ID', desc: 'Shared group ID cryptographically links all txns' },
              { icon: '✅', title: 'All-or-Nothing', desc: 'If one fails, the entire group is rejected' },
            ].map(c => (
              <div key={c.title} className="glass border border-electric-cyan/20 rounded-lg p-3 flex gap-3 items-start">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="text-electric-cyan text-sm font-bold">{c.title}</p>
                  <p className="text-muted-silver text-xs">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {errorMsg && (
          <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
            <strong>Error:</strong> {errorMsg}
            <button className="ml-3 underline" onClick={() => setErrorMsg(null)}>Dismiss</button>
          </div>
        )}

        {/* ── Success Banner ── */}
        {processStep === 'done' && batchResults.every(b => b.status === 'success') && (
          <div className="p-4 bg-toxic-green/20 border border-toxic-green rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <div>
                <p className="text-toxic-green font-bold text-lg">All Payroll Batches Confirmed On-Chain!</p>
                <p className="text-toxic-green/80 text-sm">
                  {batchResults.length} atomic group{batchResults.length > 1 ? 's' : ''} submitted successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">

          {/* ── Left: Input Panel ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Mode tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  inputMode === 'table'
                    ? 'bg-electric-cyan/20 border-electric-cyan text-electric-cyan'
                    : 'border-electric-cyan/30 text-muted-silver hover:border-electric-cyan/60'
                }`}
              >
                ✏️ Manual Entry
              </button>
              <button
                onClick={() => setInputMode('csv')}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  inputMode === 'csv'
                    ? 'bg-electric-cyan/20 border-electric-cyan text-electric-cyan'
                    : 'border-electric-cyan/30 text-muted-silver hover:border-electric-cyan/60'
                }`}
              >
                📄 CSV Upload
              </button>
            </div>

            {/* ── CSV Upload Drop Zone ── */}
            {inputMode === 'csv' && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-electric-cyan bg-electric-cyan/10'
                    : 'border-electric-cyan/40 hover:border-electric-cyan hover:bg-electric-cyan/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFileLoad(e.target.files[0]) }}
                />
                <div className="text-6xl mb-4">📄</div>
                <p className="text-xl text-foreground font-bold mb-2">Drop CSV here or click to upload</p>
                <p className="text-muted-silver text-sm mb-4">Required columns: <code className="text-electric-cyan">address, amount</code></p>
                <p className="text-muted-silver text-xs">Optional: <code className="text-muted-silver">note, type</code> — Example: <code className="text-electric-cyan">address,amount,note,type</code></p>
              </div>
            )}

            {/* ── Manual Table ── */}
            {inputMode === 'table' && (
              <GlowingCard glow="cyan" className="overflow-hidden p-0">

                {/* Validation bar */}
                {rows.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-electric-cyan/20 bg-deep-void/50">
                    <span className="text-xs text-toxic-green font-bold">✓ {validRows.length} valid</span>
                    {invalidRows.length > 0 && (
                      <span className="text-xs text-destructive font-bold">✕ {invalidRows.length} invalid</span>
                    )}
                    <span className="text-xs text-muted-silver ml-auto">
                      {batches.length} atomic group{batches.length !== 1 ? 's' : ''} × max {MAX_BATCH_SIZE} txns
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-electric-cyan/30 bg-deep-void/60">
                        <th className="text-left py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs w-1/2">
                          Recipient Address
                        </th>
                        <th className="text-right py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">
                          Amount (ALGO)
                        </th>
                        <th className="text-center py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">
                          Note
                        </th>
                        <th className="text-center py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">
                          Status
                        </th>
                        <th className="py-3 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`border-b border-electric-cyan/10 transition-colors ${
                            row.status === 'invalid' ? 'bg-destructive/5' : 'hover:bg-electric-cyan/5'
                          }`}
                        >
                          {/* Address */}
                          <td className="py-2 px-4">
                            {editingCell?.id === row.id && editingCell?.field === 'address' ? (
                              <input
                                type="text"
                                defaultValue={row.address}
                                placeholder="ALGO... (58 chars)"
                                onBlur={e => updateRow(row.id, 'address', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && updateRow(row.id, 'address', (e.target as HTMLInputElement).value)}
                                className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground font-mono text-xs w-full rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingCell({ id: row.id, field: 'address' })}
                                className={`cursor-pointer font-mono text-xs truncate block max-w-xs ${
                                  row.address
                                    ? row.status === 'valid' ? 'text-foreground hover:text-electric-cyan' : 'text-destructive'
                                    : 'text-muted-silver italic'
                                }`}
                                title={row.error || row.address}
                              >
                                {row.address || 'click to enter address…'}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-2 px-4 text-right">
                            {editingCell?.id === row.id && editingCell?.field === 'amount' ? (
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                defaultValue={row.amount || ''}
                                onBlur={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                onKeyDown={e => e.key === 'Enter' && updateRow(row.id, 'amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground w-24 text-right rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingCell({ id: row.id, field: 'amount' })}
                                className={`cursor-pointer font-bold ${row.amount > 0 ? 'text-neon-magenta' : 'text-muted-silver italic'}`}
                              >
                                {row.amount > 0 ? `${row.amount.toFixed(3)} Ⓐ` : 'click…'}
                              </span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-2 px-4 text-center">
                            {editingCell?.id === row.id && editingCell?.field === 'type' ? (
                              <select
                                defaultValue={row.type}
                                onBlur={e => updateRow(row.id, 'type', e.target.value)}
                                onChange={e => updateRow(row.id, 'type', e.target.value)}
                                className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground rounded text-xs"
                                autoFocus
                              >
                                {['salary','bounty','bonus','refund','grant','other'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            ) : (
                              <span
                                onClick={() => setEditingCell({ id: row.id, field: 'type' })}
                                className="cursor-pointer"
                              >
                                <CyberBadge variant="purple">{row.type}</CyberBadge>
                              </span>
                            )}
                          </td>

                          {/* Note */}
                          <td className="py-2 px-4">
                            {editingCell?.id === row.id && editingCell?.field === 'note' ? (
                              <input
                                type="text"
                                defaultValue={row.note}
                                maxLength={64}
                                onBlur={e => updateRow(row.id, 'note', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && updateRow(row.id, 'note', (e.target as HTMLInputElement).value)}
                                className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground text-xs w-full rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => setEditingCell({ id: row.id, field: 'note' })}
                                className="cursor-pointer text-xs text-muted-silver hover:text-foreground truncate block max-w-[140px]"
                              >
                                {row.note || 'add note…'}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2 px-4 text-center">
                            {row.status === 'valid' ? (
                              <CyberBadge variant="success">Valid</CyberBadge>
                            ) : (
                              <div className="group relative inline-block">
                                <CyberBadge variant="magenta">Invalid</CyberBadge>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-deep-void border border-neon-magenta px-3 py-2 rounded text-xs text-neon-magenta whitespace-nowrap shadow-lg">
                                    {row.error}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="py-2 px-2">
                            <button
                              onClick={() => deleteRow(row.id)}
                              className="text-muted-silver hover:text-destructive transition-colors text-lg leading-none"
                              title="Remove row"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Empty state */}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-muted-silver">
                            <div className="text-4xl mb-3">📭</div>
                            <p>No recipients yet.</p>
                            <p className="text-xs mt-1">Click "Add Recipient" below or switch to CSV Upload.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add row */}
                <div className="p-3 border-t border-electric-cyan/20">
                  <button
                    onClick={addRow}
                    className="text-electric-cyan hover:text-neon-magenta transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <span className="text-lg">+</span> Add Recipient
                  </button>
                </div>
              </GlowingCard>
            )}

            {/* ── Batch Preview ── */}
            {validRows.length > 0 && (
              <GlowingCard glow="purple">
                <h3 className="text-acid-purple font-bold uppercase tracking-widest mb-4 text-sm">
                  Atomic Group Preview — {batches.length} Group{batches.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                  {batches.map((batch, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-deep-void/50 rounded-lg border border-acid-purple/20">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-acid-purple/20 border border-acid-purple/40 flex items-center justify-center text-xs font-bold text-acid-purple">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-foreground text-sm font-bold">Atomic Group {i + 1}</p>
                          <p className="text-muted-silver text-xs">{batch.length} payment txn{batch.length > 1 ? 's' : ''} linked with shared group ID</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-neon-magenta font-bold">{batch.reduce((s, r) => s + r.amount, 0).toFixed(3)} Ⓐ</p>
                        <p className="text-muted-silver text-xs">{batch.length}/{MAX_BATCH_SIZE} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlowingCard>
            )}

            {/* ── Batch Results ── */}
            {batchResults.length > 0 && (
              <GlowingCard glow="cyan">
                <h3 className="text-electric-cyan font-bold uppercase tracking-widest mb-4 text-sm">
                  Transaction Results
                </h3>
                <div className="space-y-3">
                  {batchResults.map(b => (
                    <div
                      key={b.batchIndex}
                      className={`p-4 rounded-lg border ${
                        b.status === 'success'
                          ? 'border-toxic-green/40 bg-toxic-green/10'
                          : b.status === 'error'
                          ? 'border-destructive/40 bg-destructive/10'
                          : 'border-electric-cyan/20 bg-deep-void/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg ${
                              b.status === 'success' ? 'text-toxic-green'
                              : b.status === 'error' ? 'text-destructive'
                              : 'text-electric-cyan animate-pulse'
                            }`}>
                              {b.status === 'success' ? '✓' : b.status === 'error' ? '✕' : '◐'}
                            </span>
                            <span className="font-bold text-foreground">Atomic Group {b.batchIndex}</span>
                            <CyberBadge variant={
                              b.status === 'success' ? 'success'
                                : b.status === 'error' ? 'magenta' : 'cyan'
                            }>
                              {b.status}
                            </CyberBadge>
                          </div>
                          <p className="text-muted-silver text-xs">
                            {b.recipientCount} recipients · {b.totalAmount.toFixed(3)} ALGO total
                          </p>
                          {b.error && (
                            <p className="text-destructive text-xs mt-1">{b.error}</p>
                          )}
                        </div>
                        {b.txIds.length > 0 && (
                          <div className="text-right">
                            {b.txIds.map(txid => (
                              <a
                                key={txid}
                                href={`${ALGO_EXPLORER}/${txid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-electric-cyan hover:text-neon-magenta underline block"
                              >
                                {txid.slice(0, 8)}...{txid.slice(-6)} ↗
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlowingCard>
            )}
          </div>

          {/* ── Right: Summary + Actions ── */}
          <div className="space-y-4">

            {/* Summary Card */}
            <GlowingCard glow="magenta">
              <h3 className="text-neon-magenta font-bold uppercase tracking-widest mb-4 text-sm">Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-silver uppercase">Recipients</p>
                  <p className="text-3xl font-black text-foreground">{validRows.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase">Total ALGO</p>
                  <p className="text-2xl font-black text-neon-magenta">{totalAlgo.toFixed(3)} Ⓐ</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase">Atomic Groups</p>
                  <p className="text-xl font-bold text-acid-purple">{batches.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-silver uppercase">Est. Fees</p>
                  <p className="text-sm font-bold text-electric-cyan">~{(validRows.length * 0.001).toFixed(3)} Ⓐ</p>
                </div>
                {invalidRows.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded border border-destructive/30">
                    <p className="text-destructive text-xs font-bold">⚠ {invalidRows.length} invalid row{invalidRows.length > 1 ? 's' : ''} will be skipped</p>
                  </div>
                )}
              </div>

              {/* Process Steps */}
              {processStep && (
                <div className="mt-4 space-y-2 pt-4 border-t border-neon-magenta/20">
                  {(['building', 'signing', 'submitting', 'done'] as ProcessStep[]).map((step, i) => {
                    const stages = ['building', 'signing', 'submitting', 'done']
                    const currentIdx = stages.indexOf(processStep || '')
                    const stepIdx = i
                    const isDone = currentIdx > stepIdx || processStep === 'done'
                    const isCurrent = stages[currentIdx] === step && processStep !== 'done'
                    const labels: Record<string, string> = {
                      building: 'Building txn group…',
                      signing: 'Wallet signing…',
                      submitting: 'Submitting to Algod…',
                      done: 'Confirmed on-chain',
                    }
                    return (
                      <div key={step} className={`flex items-center gap-2 text-xs ${
                        isDone ? 'text-toxic-green' : isCurrent ? 'text-electric-cyan' : 'text-muted-silver'
                      }`}>
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                          isDone ? 'border-toxic-green' : isCurrent ? 'border-electric-cyan' : 'border-muted-silver/30'
                        }`}>
                          {isDone ? '✓' : isCurrent ? '◐' : '○'}
                        </span>
                        {labels[step!]}
                      </div>
                    )
                  })}
                </div>
              )}

              <NeonButton
                className="w-full mt-5"
                onClick={handleProcess}
                disabled={validRows.length === 0 || isProcessing || processStep === 'done'}
                loading={isProcessing}
              >
                {processStep === 'done'
                  ? '✓ Payroll Complete'
                  : isProcessing
                  ? 'Processing…'
                  : `Send ${validRows.length} Payment${validRows.length !== 1 ? 's' : ''}`}
              </NeonButton>

              {processStep === 'done' && (
                <button
                  onClick={() => {
                    setRows([])
                    setBatchResults([])
                    setProcessStep(null)
                    setErrorMsg(null)
                  }}
                  className="w-full mt-2 py-2 text-sm text-muted-silver hover:text-electric-cyan transition-colors"
                >
                  Start New Payroll
                </button>
              )}
            </GlowingCard>

            {/* Sender */}
            <GlowingCard glow="cyan" className="text-xs">
              <p className="text-muted-silver uppercase font-bold mb-2">Sender Wallet</p>
              <p className="font-mono text-electric-cyan break-all">{walletAddress}</p>
            </GlowingCard>

            {/* Info Box */}
            <GlowingCard glow="purple" className="text-xs space-y-2">
              <p className="text-acid-purple font-bold uppercase">How It Works</p>
              <ol className="text-muted-silver space-y-1 list-decimal list-inside">
                <li>Enter recipients manually or upload CSV</li>
                <li>Valid rows are grouped into atomic batches (max {MAX_BATCH_SIZE})</li>
                <li>All txns in a group share a <code className="text-electric-cyan">group ID</code></li>
                <li>Your wallet signs the entire group at once</li>
                <li>Algod confirms all-or-nothing atomically</li>
              </ol>
            </GlowingCard>
          </div>
        </div>
      </div>
    </div>
  )
}
