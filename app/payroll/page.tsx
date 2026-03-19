'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { NeonButton, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'

interface PayrollRow {
  id: string
  address: string
  amount: number
  token: string
  type: string
  status: 'valid' | 'invalid'
  error?: string
}

type ProcessStep = 'preparing' | 'simulating' | 'completed' | null

export default function BatchPayrollPage() {
  const { connected, balance } = useWallet()
  const [csvUploaded, setCsvUploaded] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([])
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [processStep, setProcessStep] = useState<ProcessStep>(null)
  const [batches, setBatches] = useState<Array<{ id: string; status: string; txId: string }>>([])

  // Mock CSV data
  const mockData: PayrollRow[] = [
    { id: '1', address: 'ALGO...ABC1', amount: 50, token: 'USDC', type: 'bounty', status: 'valid' },
    { id: '2', address: 'ALGO...DEF2', amount: 75, token: 'USDC', type: 'bounty', status: 'valid' },
    { id: '3', address: 'ALGO...GHI3', amount: 100, token: 'USDC', type: 'bonus', status: 'valid' },
    { id: '4', address: 'INVALID', amount: 25, token: 'USDC', type: 'bounty', status: 'invalid', error: 'Invalid Algorand address format' },
    { id: '5', address: 'ALGO...JKL4', amount: 0, token: 'USDC', type: 'bounty', status: 'invalid', error: 'Amount must be greater than 0' },
    { id: '6', address: 'ALGO...MNO5', amount: 200, token: 'ALGO', type: 'bounty', status: 'valid' },
    { id: '7', address: 'ALGO...PQR6', amount: 150, token: 'USDC', type: 'refund', status: 'valid' },
  ]

  const handleUpload = () => {
    setCsvUploaded(true)
    setPayrollRows(mockData)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleUpload()
  }

  const updateRow = (id: string, field: string, value: string | number) => {
    setPayrollRows(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value }
        // Re-validate
        if (field === 'address' && typeof value === 'string' && !value.startsWith('ALGO')) {
          updated.status = 'invalid'
          updated.error = 'Invalid Algorand address format'
        } else if (field === 'amount' && (typeof value === 'number' ? value <= 0 : parseFloat(value) <= 0)) {
          updated.status = 'invalid'
          updated.error = 'Amount must be greater than 0'
        } else {
          updated.status = 'valid'
          updated.error = undefined
        }
        return updated
      }
      return row
    }))
    setEditingCell(null)
  }

  const validRows = payrollRows.filter(r => r.status === 'valid')
  const invalidRows = payrollRows.filter(r => r.status === 'invalid')
  const totalAmount = validRows.reduce((sum, r) => sum + r.amount, 0)

  const handleProcess = async () => {
    setProcessStep('preparing')
    await new Promise(r => setTimeout(r, 1500))
    
    setProcessStep('simulating')
    await new Promise(r => setTimeout(r, 2000))
    
    setBatches([
      { id: '1', status: 'Success', txId: 'MOCK123...ABC' },
      { id: '2', status: 'Success', txId: 'MOCK456...DEF' },
    ])
    setProcessStep('completed')
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
        <GlowingCard glow="magenta" className="max-w-md">
          <h1 className="text-2xl font-black text-neon-magenta mb-4">Access Required</h1>
          <p className="text-muted-silver mb-6">Connect your Algorand wallet to access batch payroll.</p>
          <Link href="/dashboard" className="text-electric-cyan hover:text-neon-magenta transition-colors">
            ← Back to Dashboard
          </Link>
        </GlowingCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deep-void p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-black text-electric-cyan uppercase tracking-widest mb-2">
            Batch Payroll
          </h1>
          <p className="text-muted-silver mb-4">
            Upload a CSV to pay multiple Algorand addresses in one go (simulation only).
          </p>
          <div className="inline-block glass px-3 py-2 rounded text-sm">
            <span className="text-muted-silver">Example CSV header:</span>
            <code className="text-electric-cyan ml-2">address,amount,token,type</code>
          </div>
        </div>

        {/* Success Banner */}
        {processStep === 'completed' && (
          <div className="mb-6 p-4 bg-toxic-green/20 border border-toxic-green rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="text-toxic-green font-bold">Payroll Processed Successfully!</p>
                <p className="text-toxic-green/80 text-sm">All batches have been simulated successfully.</p>
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload Panel */}
        {!csvUploaded && (
          <div 
            onClick={handleUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
              ${isDragOver 
                ? 'border-electric-cyan bg-electric-cyan/10' 
                : 'border-electric-cyan/50 hover:border-electric-cyan hover:bg-electric-cyan/5'
              }
            `}
          >
            <div className="text-5xl mb-4">📄</div>
            <p className="text-xl text-foreground font-bold mb-2">Drop CSV here or click to upload</p>
            <p className="text-muted-silver text-sm">Supports .csv files up to 10MB</p>
          </div>
        )}

        {/* Validation Summary */}
        {csvUploaded && (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 bg-toxic-green/20 text-toxic-green px-4 py-2 rounded">
                <span>✓</span>
                <span className="font-bold">{validRows.length} rows valid</span>
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-2 bg-destructive/20 text-destructive px-4 py-2 rounded">
                  <span>✕</span>
                  <span className="font-bold">{invalidRows.length} rows invalid</span>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <GlowingCard glow="cyan" className="mb-6 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-electric-cyan/30">
                      <th className="text-left py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">Address</th>
                      <th className="text-right py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">Amount</th>
                      <th className="text-center py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">Token</th>
                      <th className="text-center py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">Type</th>
                      <th className="text-center py-3 px-4 text-electric-cyan font-bold uppercase tracking-widest text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRows.map(row => (
                      <tr 
                        key={row.id} 
                        className={`border-b border-electric-cyan/10 hover:bg-electric-cyan/5 transition-colors ${
                          row.status === 'invalid' ? 'bg-destructive/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          {editingCell?.id === row.id && editingCell?.field === 'address' ? (
                            <input
                              type="text"
                              defaultValue={row.address}
                              onBlur={(e) => updateRow(row.id, 'address', e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && updateRow(row.id, 'address', (e.target as HTMLInputElement).value)}
                              className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground w-full"
                              autoFocus
                            />
                          ) : (
                            <span 
                              onClick={() => setEditingCell({ id: row.id, field: 'address' })}
                              className="cursor-pointer hover:text-electric-cyan font-mono"
                            >
                              {row.address}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editingCell?.id === row.id && editingCell?.field === 'amount' ? (
                            <input
                              type="number"
                              defaultValue={row.amount}
                              onBlur={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && updateRow(row.id, 'amount', parseFloat((e.target as HTMLInputElement).value))}
                              className="bg-deep-void border border-electric-cyan px-2 py-1 text-foreground w-20 text-right"
                              autoFocus
                            />
                          ) : (
                            <span 
                              onClick={() => setEditingCell({ id: row.id, field: 'amount' })}
                              className="cursor-pointer hover:text-electric-cyan font-bold text-neon-magenta"
                            >
                              {row.amount}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-foreground">{row.token}</td>
                        <td className="py-3 px-4 text-center">
                          <CyberBadge variant="purple">{row.type}</CyberBadge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.status === 'valid' ? (
                            <CyberBadge variant="success">Valid</CyberBadge>
                          ) : (
                            <div className="group relative">
                              <CyberBadge variant="magenta">Invalid</CyberBadge>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-deep-void border border-neon-magenta px-3 py-2 rounded text-xs text-neon-magenta whitespace-nowrap">
                                  {row.error}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlowingCard>

            {/* Summary & Process */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Process Steps */}
                {processStep && (
                  <GlowingCard glow="purple" className="mb-6">
                    <h3 className="text-acid-purple font-bold uppercase tracking-widest mb-4">Processing</h3>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 ${processStep === 'preparing' ? 'text-electric-cyan' : 'text-toxic-green'}`}>
                        <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">
                          {processStep === 'preparing' ? '◐' : '✓'}
                        </span>
                        <span>Preparing transactions...</span>
                      </div>
                      <div className={`flex items-center gap-3 ${
                        processStep === 'simulating' ? 'text-electric-cyan' : 
                        processStep === 'completed' ? 'text-toxic-green' : 'text-muted-silver'
                      }`}>
                        <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">
                          {processStep === 'simulating' ? '◐' : processStep === 'completed' ? '✓' : '○'}
                        </span>
                        <span>Simulating signatures...</span>
                      </div>
                      <div className={`flex items-center gap-3 ${
                        processStep === 'completed' ? 'text-toxic-green' : 'text-muted-silver'
                      }`}>
                        <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">
                          {processStep === 'completed' ? '✓' : '○'}
                        </span>
                        <span>Completed</span>
                      </div>
                    </div>

                    {/* Batch Results */}
                    {batches.length > 0 && (
                      <div className="mt-6 space-y-2">
                        {batches.map(batch => (
                          <div key={batch.id} className="flex items-center justify-between p-3 bg-deep-void/50 rounded">
                            <span className="text-foreground">Batch {batch.id}</span>
                            <div className="flex items-center gap-3">
                              <CyberBadge variant="success">{batch.status}</CyberBadge>
                              <span className="text-xs text-muted-silver font-mono">Tx: {batch.txId}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlowingCard>
                )}
              </div>

              {/* Summary Card */}
              <GlowingCard glow="magenta">
                <h3 className="text-neon-magenta font-bold uppercase tracking-widest mb-4">Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-silver uppercase">Recipients</p>
                    <p className="text-2xl font-black text-foreground">{validRows.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-silver uppercase">Total Amount</p>
                    <p className="text-2xl font-black text-neon-magenta">{totalAmount.toLocaleString()} USDC</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-silver uppercase">Wallet Balance</p>
                    <p className="text-lg font-bold text-electric-cyan">{balance.toLocaleString()} ALGO</p>
                  </div>
                </div>

                <NeonButton 
                  className="w-full mt-6" 
                  onClick={handleProcess}
                  disabled={validRows.length === 0 || processStep !== null}
                  loading={processStep !== null && processStep !== 'completed'}
                >
                  {processStep === 'completed' ? 'Processed' : 'Process Payroll'}
                </NeonButton>
              </GlowingCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
