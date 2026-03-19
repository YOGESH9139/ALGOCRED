'use client'

import React from 'react'

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
}

export function NeonButton({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  className = '',
  disabled,
  ...props
}: NeonButtonProps) {
  const baseStyles = `
    font-bold tracking-wider transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
    active:scale-[0.98] active:brightness-90
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-electric-cyan to-electric-cyan text-deep-void
      shadow-[0_0_10px_oklch(0.8_0.2_195/0.5)]
      hover:from-electric-cyan hover:via-neon-magenta hover:to-neon-magenta
      hover:shadow-[0_0_20px_oklch(0.7_0.25_330/0.6)]
      hover:scale-[1.02]
    `,
    secondary: `
      bg-gradient-to-r from-neon-magenta to-neon-magenta text-deep-void
      shadow-[0_0_10px_oklch(0.7_0.25_330/0.5)]
      hover:from-neon-magenta hover:via-acid-purple hover:to-acid-purple
      hover:shadow-[0_0_20px_oklch(0.6_0.25_290/0.6)]
      hover:scale-[1.02]
    `,
    outline: `
      border-2 border-electric-cyan text-electric-cyan bg-transparent
      hover:border-neon-magenta hover:text-neon-magenta hover:bg-neon-magenta/10
      hover:shadow-[0_0_15px_oklch(0.7_0.25_330/0.3)]
      hover:scale-[1.02]
    `,
    ghost: `
      text-electric-cyan bg-transparent
      hover:text-neon-magenta hover:bg-neon-magenta/10
    `,
    destructive: `
      bg-destructive text-destructive-foreground
      hover:brightness-110
    `
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : children}
    </button>
  )
}

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function NeonInput({ label, error, className = '', ...props }: NeonInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-electric-cyan mb-2 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-deep-void border border-electric-cyan/50 text-foreground 
          placeholder-muted-silver px-3 py-2 
          focus:outline-none focus:border-electric-cyan focus:shadow-[0_0_10px_oklch(0.8_0.2_195/0.3)]
          transition-all
          ${error ? 'border-neon-magenta focus:border-neon-magenta' : ''} 
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-neon-magenta text-xs mt-1">{error}</p>}
    </div>
  )
}

interface GlowingCardProps {
  children: React.ReactNode
  glow?: 'magenta' | 'cyan' | 'purple' | 'green'
  className?: string
}

export function GlowingCard({ children, glow = 'cyan', className = '' }: GlowingCardProps) {
  const glowClasses = {
    magenta: 'border-neon-magenta/50 shadow-[0_0_15px_oklch(0.7_0.25_330/0.2)] hover:shadow-[0_0_25px_oklch(0.7_0.25_330/0.4)] hover:border-neon-magenta',
    cyan: 'border-electric-cyan/50 shadow-[0_0_15px_oklch(0.8_0.2_195/0.2)] hover:shadow-[0_0_25px_oklch(0.8_0.2_195/0.4)] hover:border-electric-cyan',
    purple: 'border-acid-purple/50 shadow-[0_0_15px_oklch(0.6_0.25_290/0.2)] hover:shadow-[0_0_25px_oklch(0.6_0.25_290/0.4)] hover:border-acid-purple',
    green: 'border-toxic-green/50 shadow-[0_0_15px_oklch(0.75_0.22_145/0.2)] hover:shadow-[0_0_25px_oklch(0.75_0.22_145/0.4)] hover:border-toxic-green'
  }

  return (
    <div
      className={`
        glass border p-4 transition-all duration-300
        ${glowClasses[glow]} 
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface HolographicPanelProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export function HolographicPanel({ children, title, className = '' }: HolographicPanelProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-electric-cyan/10 to-neon-magenta/10 pointer-events-none" />
      <div className="relative z-10 glass border border-electric-cyan/50 p-6">
        {title && <h3 className="text-lg font-bold text-electric-cyan mb-4 uppercase tracking-widest">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

interface CyberBadgeProps {
  children: React.ReactNode
  variant?: 'magenta' | 'cyan' | 'purple' | 'success'
  className?: string
}

export function CyberBadge({ children, variant = 'cyan', className = '' }: CyberBadgeProps) {
  const variants = {
    magenta: 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta',
    cyan: 'bg-electric-cyan/20 border-electric-cyan text-electric-cyan',
    purple: 'bg-acid-purple/20 border-acid-purple text-acid-purple',
    success: 'bg-toxic-green/20 border-toxic-green text-toxic-green'
  }

  return (
    <span className={`inline-block border px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface AnimatedBorderProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedBorder({ children, className = '' }: AnimatedBorderProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan via-neon-magenta to-acid-purple rounded-lg opacity-75 blur animate-pulse" />
      <div className="relative bg-deep-void rounded-lg">
        {children}
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className = '' }: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <div key={step} className="flex-1 flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-widest transition-all ${
              index <= currentStep
                ? 'bg-electric-cyan text-deep-void shadow-[0_0_10px_oklch(0.8_0.2_195/0.5)]'
                : 'border-2 border-electric-cyan/50 text-electric-cyan/50'
            }`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-electric-cyan' : 'bg-electric-cyan/30'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`inline-block ${className}`}>
      <div className="w-8 h-8 border-2 border-electric-cyan border-t-neon-magenta rounded-full animate-spin" />
    </div>
  )
}
