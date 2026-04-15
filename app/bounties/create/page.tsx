'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import algosdk from 'algosdk'
import { AlgocredBountyManagerFactory } from '@/contracts/AlgocredBountyManagerClient'
import { NeonButton, NeonInput, GlowingCard, CyberBadge } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'
import { Loader2 } from 'lucide-react'

const steps = ['Details', 'Criteria', 'Reward & Timing', 'Advanced', 'Review']

export default function CreateBountyPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        category: 'Code',
        description: '',
        criteria: ['Deliver clean, documented code', 'Include unit tests'],
        rewardAmount: '100',
        token: 'ALGO',
        deadline: '',
        maxSubmissions: '10',
        minReputation: '3',
        tags: [] as string[],
        attachments: [] as string[]
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [tagInput, setTagInput] = useState('')
    const { connected, activeAccount, transactionSigner } = useWallet()

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const addCriterion = () => {
        setFormData(prev => ({ ...prev, criteria: [...prev.criteria, ''] }))
    }

    const updateCriterion = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            criteria: prev.criteria.map((c, i) => i === index ? value : c)
        }))
    }

    const removeCriterion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            criteria: prev.criteria.filter((_, i) => i !== index)
        }))
    }

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
            }
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
    }

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}

        if (step === 0) {
            if (!formData.title.trim()) newErrors.title = 'Title is required'
            if (formData.title.length > 100) newErrors.title = 'Title must be under 100 characters'
            if (!formData.description.trim()) newErrors.description = 'Description is required'
        } else if (step === 1) {
            if (formData.criteria.filter(c => c.trim()).length < 1) {
                newErrors.criteria = 'At least one criterion is required'
            }
        } else if (step === 2) {
            if (!formData.rewardAmount || parseFloat(formData.rewardAmount) <= 0) {
                newErrors.rewardAmount = 'Valid reward amount is required'
            }
            if (!formData.deadline) newErrors.deadline = 'Deadline is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
        }
    }

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        if (!activeAccount || !transactionSigner) {
            toast.error("Please connect your wallet first");
            return;
        }

        const NEXT_PUBLIC_MANAGER_APP_ID = process.env.NEXT_PUBLIC_MANAGER_APP_ID;
        if (!NEXT_PUBLIC_MANAGER_APP_ID) {
            toast.error("Global System Contract missing in environment variables!");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Processing Bounty on Algorand TestNet...");

        try {
            const algorand = AlgorandClient.fromConfig({
                algodConfig: { server: "https://testnet-api.algonode.cloud", port: "", token: "" },
                indexerConfig: { server: "https://testnet-api.algonode.cloud", port: "", token: "" },
            });

            const factory = new AlgocredBountyManagerFactory({
                algorand,
                defaultSender: activeAccount.address,
                defaultSigner: transactionSigner,
            });

            const managerClient = factory.getAppClientById({ appId: BigInt(NEXT_PUBLIC_MANAGER_APP_ID) });
            const appAddress = managerClient.appAddress;

            const bountyCost = BigInt(Math.floor(parseFloat(formData.rewardAmount) * 1e6));
            const totalRequired = Number(bountyCost) + 1_000_000; // Reward + 1 ALGO Box MBR
            
            // PRE-FLIGHT BALANCE CHECK
            const accountInfo = await algorand.client.algod.accountInformation(activeAccount.address).do();
            const currentBalance = Number(accountInfo.amount);
            
            if (currentBalance < totalRequired) {
                const deficit = (totalRequired - currentBalance) / 1e6;
                toast.error(`Insufficient Funds! You have ${currentBalance/1e6} ALGO but this bounty requires ${totalRequired/1e6} ALGO. Please get more ALGO from the faucet.`, { id: toastId });
                setIsSubmitting(false);
                return;
            }

            const bountyIdNum = Math.floor(Math.random() * 10000000);
            const bountyIdBig = BigInt(bountyIdNum);
            
            // Approximate deadline (days -> seconds)
            const daysOffset = formData.deadline ? Math.abs((new Date(formData.deadline).getTime() - Date.now()) / 1000) : 86400;
            const endTime = Math.floor(Date.now() / 1000 + daysOffset);

            toast.loading("Please approve the Atomic Group transaction in Pera Wallet...", { id: toastId });

            await algorand
                .newGroup()
                // 1. Fund escrow + Box Creation MBR (1 ALGO)
                .addPayment({
                    sender: activeAccount.address,
                    receiver: appAddress,
                    amount: AlgoAmount.MicroAlgos(Number(bountyCost) + 1_000_000),
                    signer: transactionSigner
                })
                // 2. Execute App Call
                .addAppCallMethodCall(
                    await managerClient.params.createBounty({
                        sender: activeAccount.address,
                        signer: transactionSigner,
                        args: {
                            config: [
                                bountyIdBig,
                                formData.title,
                                formData.category,
                                formData.description,
                                activeAccount.address,
                                formData.attachments.length > 0 ? formData.attachments[0] : "", 
                                bountyCost,
                                BigInt(endTime),
                                BigInt(0),
                                BigInt(0),
                                BigInt(0)
                            ]
                        },
                        boxReferences: [{ appId: BigInt(NEXT_PUBLIC_MANAGER_APP_ID), name: algosdk.encodeUint64(bountyIdNum) }]
                    })
                )
                .execute();

            toast.success("Bounty successfully locked in Escrow!", { id: toastId });
            router.push('/bounties');
        } catch (e: any) {
            console.error(e);
            toast.error(`Transaction failed: ${e.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!connected) {
        return (
            <div className="min-h-screen bg-deep-void flex items-center justify-center p-4">
                <GlowingCard glow="magenta" className="max-w-md">
                    <h1 className="text-2xl font-black text-neon-magenta mb-4">Wallet Required</h1>
                    <p className="text-muted-silver mb-6">Connect your Algorand wallet to create a bounty.</p>
                    <Link href="/dashboard" className="text-electric-cyan hover:text-neon-magenta transition-colors">
                        ← Back to Dashboard
                    </Link>
                </GlowingCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-deep-void p-4 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl lg:text-5xl font-black text-electric-cyan mb-2 uppercase tracking-widest">
                    Create Bounty
                </h1>
                <p className="text-muted-silver mb-8">Define your task and post it to the marketplace</p>

                {/* Flexible Wrapping Stepper */}
                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-y-4">
                        {steps.map((step, index) => (
                            <React.Fragment key={step}>
                                <button
                                    onClick={() => index < currentStep && setCurrentStep(index)}
                                    className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all ${index === currentStep
                                        ? 'bg-electric-cyan text-deep-void'
                                        : index < currentStep
                                            ? 'bg-electric-cyan/20 text-electric-cyan cursor-pointer hover:bg-electric-cyan/30'
                                            : 'bg-charcoal-steel text-muted-silver cursor-default'
                                        }`}
                                >
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-current">
                                        {index < currentStep ? '✓' : index + 1}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">{step}</span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`w-4 lg:w-8 h-0.5 mx-1 lg:mx-0 ${index < currentStep ? 'bg-electric-cyan' : 'bg-charcoal-steel'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Steps */}
                <GlowingCard glow="cyan" className="mb-8">
                    {/* Step 1: Details */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-electric-cyan uppercase tracking-widest">Details</h2>
                            <div>
                                <NeonInput
                                    label={`Title (${formData.title.length}/100)`}
                                    placeholder="E.g., Build Algorand Indexer API"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    error={errors.title}
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe the task in detail..."
                                    className="w-full h-32 bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors resize-none"
                                />
                                {errors.description && <p className="text-neon-magenta text-xs mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                                >
                                    <option>Code</option>
                                    <option>Design</option>
                                    <option>Writing</option>
                                    <option>Data</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Criteria */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-acid-purple uppercase tracking-widest">Acceptance Criteria</h2>
                            <p className="text-muted-silver text-sm">Define what workers must deliver to complete this bounty.</p>

                            <div className="space-y-3">
                                {formData.criteria.map((criterion, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="text-muted-silver cursor-move">⋮⋮</span>
                                        <input
                                            type="text"
                                            value={criterion}
                                            onChange={(e) => updateCriterion(index, e.target.value)}
                                            placeholder="Enter criterion..."
                                            className="flex-1 bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                                        />
                                        <button
                                            onClick={() => removeCriterion(index)}
                                            className="text-neon-magenta hover:text-neon-magenta/80 p-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <NeonButton variant="outline" size="sm" onClick={addCriterion}>
                                + Add Criterion
                            </NeonButton>

                            {errors.criteria && <p className="text-neon-magenta text-xs">{errors.criteria}</p>}
                        </div>
                    )}

                    {/* Step 3: Reward & Timing */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-neon-magenta uppercase tracking-widest">Reward & Timing</h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <NeonInput
                                    label="Reward Amount"
                                    type="number"
                                    placeholder="100"
                                    value={formData.rewardAmount}
                                    onChange={(e) => handleInputChange('rewardAmount', e.target.value)}
                                    error={errors.rewardAmount}
                                />
                                <div>
                                    <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Token</label>
                                    <select
                                        value={formData.token}
                                        onChange={(e) => handleInputChange('token', e.target.value)}
                                        className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                                        disabled
                                    >
                                        <option>ALGO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Deadline</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            required
                                            className="w-full bg-deep-void border border-electric-cyan/30 rounded p-4 text-foreground focus:border-neon-magenta outline-none transition-all focus:shadow-[0_0_15px_rgba(255,0,255,0.2)] appearance-none cursor-pointer"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    {errors.deadline && <p className="text-neon-magenta text-xs mt-1">{errors.deadline}</p>}
                                </div>
                                <NeonInput
                                    label="Max Submissions (optional)"
                                    type="number"
                                    placeholder="10"
                                    value={formData.maxSubmissions}
                                    onChange={(e) => handleInputChange('maxSubmissions', e.target.value)}
                                />
                            </div>

                            <div className="glass p-3 border border-electric-cyan/30 rounded">
                                <p className="text-muted-silver text-sm">
                                    The Reward ALGO and an extra 1.0 ALGO for Contract Box tracking will be deposited into the Escrow.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Advanced */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-acid-purple uppercase tracking-widest">Advanced Options</h2>

                            <div>
                                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Minimum Worker Reputation</label>
                                <select
                                    value={formData.minReputation}
                                    onChange={(e) => handleInputChange('minReputation', e.target.value)}
                                    className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                                >
                                    <option value="0">Any reputation</option>
                                    <option value="3">3+ stars</option>
                                    <option value="4">4+ stars</option>
                                    <option value="4.5">4.5+ stars</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Tags (Press Enter to add)</label>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={addTag}
                                    placeholder="Type a tag and press Enter..."
                                    className="w-full bg-deep-void border border-electric-cyan/50 text-foreground px-3 py-2 focus:outline-none focus:border-electric-cyan transition-colors"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 bg-electric-cyan/20 border border-electric-cyan text-electric-cyan px-2 py-1 text-xs"
                                        >
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-neon-magenta">✕</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">Attachments</label>
                                <div className="border-2 border-dashed border-electric-cyan/50 rounded-lg p-8 text-center hover:border-electric-cyan hover:bg-electric-cyan/5 transition-all cursor-pointer">
                                    <div className="text-4xl mb-2">📎</div>
                                    <p className="text-muted-silver text-sm">Drop files here or click to upload</p>
                                    <p className="text-muted-silver/60 text-xs mt-1">PDF, Images, ZIP (Max 10MB)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-electric-cyan uppercase tracking-widest">Review & Create</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start border-b border-electric-cyan/20 pb-4">
                                    <div>
                                        <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Title</p>
                                        <p className="text-foreground font-bold">{formData.title || '-'}</p>
                                    </div>
                                    <CyberBadge variant="cyan">{formData.category}</CyberBadge>
                                </div>

                                <div className="border-b border-electric-cyan/20 pb-4">
                                    <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Description</p>
                                    <p className="text-foreground text-sm">{formData.description || '-'}</p>
                                </div>

                                <div className="border-b border-electric-cyan/20 pb-4">
                                    <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Acceptance Criteria</p>
                                    <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                                        {formData.criteria.filter(c => c.trim()).map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-b border-electric-cyan/20 pb-4">
                                    <div>
                                        <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Reward</p>
                                        <p className="text-2xl font-black text-neon-magenta">{formData.rewardAmount} {formData.token}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-silver uppercase tracking-widest mb-1">Deadline</p>
                                        <p className="text-foreground font-bold">{formData.deadline || '-'}</p>
                                    </div>
                                </div>

                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map(tag => (
                                            <CyberBadge key={tag} variant="purple">{tag}</CyberBadge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="glass p-3 border border-toxic-green/30 rounded">
                                <p className="text-toxic-green text-sm">
                                    Your bounty will be published immediately. Workers can start submitting within seconds.
                                </p>
                            </div>
                        </div>
                    )}
                </GlowingCard>

                {/* Navigation */}
                <div className="flex gap-4 justify-between">
                    <NeonButton
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className={currentStep === 0 ? 'opacity-30' : ''}
                    >
                        Back & Edit
                    </NeonButton>

                    {currentStep === steps.length - 1 ? (
                        <NeonButton
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            size="lg"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Escrowing...
                                </span>
                            ) : 'Create Bounty on TestNet'}
                        </NeonButton>
                    ) : (
                        <NeonButton onClick={handleNext} size="lg">
                            Next Step
                        </NeonButton>
                    )}
                </div>
            </div>
        </div>
    )
}