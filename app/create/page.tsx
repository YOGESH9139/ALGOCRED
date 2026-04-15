'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { NeonButton, NeonInput, GlowingCard, StepIndicator } from '@/components/cyber-ui'
import { useWallet } from '@/lib/wallet-context'

const steps = ['Basics', 'Details', 'Pricing', 'Review']

export default function CreateBountyPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    category: 'web development',
    description: '',
    requirements: '',
    reward: '1',
    deadline: '48'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { connected } = useWallet()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
    } else if (step === 1) {
      if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required'
    } else if (step === 2) {
      if (!formData.reward || parseFloat(formData.reward) <= 0) newErrors.reward = 'Valid reward is required'
      if (!formData.deadline || parseInt(formData.deadline) <= 0) newErrors.deadline = 'Valid deadline is required'
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

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      toast.success(`Bounty "${formData.title}" created!`, {
        description: `Reward: ${formData.reward} ALGO · Deadline: ${formData.deadline}h`,
      })
      // Reset form
      setFormData({
        title: '',
        category: 'web development',
        description: '',
        requirements: '',
        reward: '1',
        deadline: '48'
      })
      setCurrentStep(0)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center py-12">
        <GlowingCard glow="magenta" className="max-w-md">
          <h1 className="text-2xl font-black text-cyber-magenta mb-4">Wallet Required</h1>
          <p className="text-cyber-light/80 mb-6">You need to connect your wallet to create a bounty.</p>
          <Link href="/" className="text-cyber-cyan hover:text-cyber-magenta">
            ← Back Home
          </Link>
        </GlowingCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-dark py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-5xl font-black text-cyber-cyan mb-2 uppercase tracking-widest">
          Create Bounty
        </h1>
        <p className="text-cyber-light/60 mb-8">Post a task and start receiving submissions</p>

        {/* Step Indicator */}
        <div className="mb-12">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Form Steps */}
        <GlowingCard glow="cyan">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-cyber-cyan uppercase tracking-widest">Basic Information</h2>
              <NeonInput
                label="Bounty Title"
                placeholder="E.g., Build a React Dashboard"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
              />
              <div>
                <label className="block text-xs font-bold text-cyber-cyan mb-2 uppercase tracking-widest">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full bg-cyber-dark border-2 border-cyber-cyan text-cyber-light px-3 py-2 focus:outline-none focus:shadow-neon-cyan"
                >
                  <option>web development</option>
                  <option>mobile development</option>
                  <option>data analysis</option>
                  <option>content creation</option>
                  <option>design</option>
                  <option>other</option>
                </select>
              </div>
              <NeonInput
                label="Description"
                placeholder="Describe the task in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-cyber-purple uppercase tracking-widest">Requirements</h2>
              <NeonInput
                label="What do you need?"
                placeholder="List specific requirements and deliverables..."
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                error={errors.requirements}
              />
              <div className="bg-cyber-dark/50 border-2 border-cyber-purple/50 p-4 rounded">
                <p className="text-cyber-light/60 text-sm">
                  ⚡ Tip: Be specific about deliverables and acceptance criteria. This helps workers understand expectations and reduces disputes.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-cyber-magenta uppercase tracking-widest">Pricing & Timeline</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <NeonInput
                  label="Reward (ALGO)"
                  placeholder="100"
                  type="number"
                  step="1"
                  value={formData.reward}
                  onChange={(e) => handleInputChange('reward', e.target.value)}
                  error={errors.reward}
                />
                <NeonInput
                  label="Deadline (Hours)"
                  placeholder="48"
                  type="number"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  error={errors.deadline}
                />
              </div>
              <div className="bg-cyber-dark/50 border-2 border-cyber-magenta/50 p-4 rounded">
                <p className="text-cyber-light/60 text-sm">
                  💰 You&apos;ll need to deposit the full reward amount + 2% platform fee. Total: {(parseFloat(formData.reward || '0') * 1.02).toFixed(2)} ALGO
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-cyber-cyan uppercase tracking-widest">Review & Publish</h2>
              <div className="space-y-4">
                <div className="border-l-2 border-cyber-cyan pl-4">
                  <p className="text-cyber-light/60 text-xs uppercase tracking-widest">Title</p>
                  <p className="text-cyber-light font-bold">{formData.title}</p>
                </div>
                <div className="border-l-2 border-cyber-cyan pl-4">
                  <p className="text-cyber-light/60 text-xs uppercase tracking-widest">Category</p>
                  <p className="text-cyber-light font-bold">{formData.category}</p>
                </div>
                <div className="border-l-2 border-cyber-cyan pl-4">
                  <p className="text-cyber-light/60 text-xs uppercase tracking-widest">Reward</p>
                  <p className="text-cyber-magenta font-bold">{formData.reward} ALGO</p>
                </div>
                <div className="border-l-2 border-cyber-cyan pl-4">
                  <p className="text-cyber-light/60 text-xs uppercase tracking-widest">Deadline</p>
                  <p className="text-cyber-light font-bold">{formData.deadline} hours</p>
                </div>
              </div>
              <div className="bg-cyber-dark/50 border-2 border-cyber-cyan/50 p-4 rounded">
                <p className="text-cyber-light/60 text-sm">
                  ✓ Your bounty will be published immediately. Workers can start submitting within seconds.
                </p>
              </div>
            </div>
          )}
        </GlowingCard>

        {/* Navigation */}
        <div className="flex gap-4 mt-8 justify-between">
          <NeonButton
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={currentStep === 0 ? 'opacity-30' : ''}
          >
            Previous
          </NeonButton>

          {currentStep === steps.length - 1 ? (
            <NeonButton
              variant="secondary"
              onClick={handleSubmit}
              size="lg"
            >
              Publish Bounty
            </NeonButton>
          ) : (
            <NeonButton
              onClick={handleNext}
              size="lg"
            >
              Next Step
            </NeonButton>
          )}
        </div>
      </div>
    </div>
  )
}
