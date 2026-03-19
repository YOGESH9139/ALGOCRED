import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { RootLayoutClient } from '@/components/root-layout-client'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ALGOCRED - Neon Ledger Bounty Platform',
  description: 'Dual-reputation bounty and batch payroll platform on Algorand',
}

export const viewport: Viewport = {
  themeColor: '#00ffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        <Analytics />
      </body>
    </html>
  )
}
