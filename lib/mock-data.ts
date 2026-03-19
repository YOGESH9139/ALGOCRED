export interface Bounty {
  id: string
  title: string
  description: string
  shortDescription: string
  reward: number
  currency: string
  deadline: string
  status: 'open' | 'in-progress' | 'review' | 'completed' | 'expired'
  category: string
  skills: string[]
  poster: User & { totalBounties?: number }
  submissions: Submission[]
  createdAt: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  applicants: number
  requirements: string[]
  tags?: string[]
}

export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  walletAddress: string
  rating: number
  reviewCount: number
  completedBounties: number
  postedBounties: number
  joinedAt: string
  bio: string
  skills: string[]
  socialLinks: {
    twitter?: string
    github?: string
    discord?: string
  }
}

export interface Submission {
  id: string
  bountyId: string
  hunter: User
  status: 'pending' | 'approved' | 'rejected' | 'revision-requested'
  submittedAt: string
  description: string
  attachments: string[]
  feedback?: string
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'bounty-paid' | 'bounty-received'
  amount: number
  currency: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  description: string
  txHash?: string
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'neon_hacker',
    displayName: 'Neon Hacker',
    avatar: '/avatars/avatar-1.png',
    walletAddress: '0x1234...5678',
    rating: 4.9,
    reviewCount: 47,
    completedBounties: 52,
    postedBounties: 12,
    joinedAt: '2024-03-15',
    bio: 'Full-stack developer specializing in Web3 and DeFi protocols. Building the future, one smart contract at a time.',
    skills: ['Solidity', 'React', 'TypeScript', 'Rust'],
    socialLinks: {
      twitter: '@neon_hacker',
      github: 'neonhacker',
      discord: 'neonhacker#1234'
    }
  },
  {
    id: 'user-2',
    username: 'cyber_artist',
    displayName: 'Cyber Artist',
    avatar: '/avatars/avatar-2.png',
    walletAddress: '0xabcd...efgh',
    rating: 4.7,
    reviewCount: 23,
    completedBounties: 28,
    postedBounties: 5,
    joinedAt: '2024-06-22',
    bio: 'Digital artist and NFT creator. Bringing cyberpunk aesthetics to the blockchain.',
    skills: ['UI/UX', 'Figma', 'Illustration', 'Motion Design'],
    socialLinks: {
      twitter: '@cyber_artist',
      discord: 'cyberartist#5678'
    }
  },
  {
    id: 'user-3',
    username: 'data_runner',
    displayName: 'Data Runner',
    avatar: '/avatars/avatar-3.png',
    walletAddress: '0x9876...5432',
    rating: 4.8,
    reviewCount: 89,
    completedBounties: 104,
    postedBounties: 34,
    joinedAt: '2023-11-08',
    bio: 'Security researcher and smart contract auditor. Finding vulnerabilities before the bad actors do.',
    skills: ['Security Audit', 'Penetration Testing', 'Smart Contracts', 'Python'],
    socialLinks: {
      twitter: '@data_runner',
      github: 'datarunner',
      discord: 'datarunner#9012'
    }
  }
]

export const mockBounties: Bounty[] = [
  {
    id: 'bounty-1',
    title: 'Build a Decentralized Exchange Interface',
    description: `## Overview
We need a skilled developer to create a modern, responsive DEX interface that integrates with our existing smart contracts.

## Requirements
- Clean, cyberpunk-inspired UI design
- Token swap functionality with slippage controls
- Liquidity pool management dashboard
- Wallet connection (MetaMask, WalletConnect)
- Transaction history with real-time updates

## Technical Stack
- React 18+ with TypeScript
- TailwindCSS for styling
- ethers.js or viem for Web3 integration
- TanStack Query for data management

## Deliverables
1. Fully functional DEX interface
2. Documentation for components
3. Test coverage > 80%`,
    shortDescription: 'Create a modern DEX interface with token swap, liquidity pools, and wallet integration.',
    reward: 5000,
    currency: 'USDC',
    deadline: '2026-04-15',
    status: 'open',
    category: 'Development',
    skills: ['React', 'TypeScript', 'Web3', 'TailwindCSS'],
    poster: { ...mockUsers[2], totalBounties: 34 },
    submissions: [],
    createdAt: '2026-03-01',
    difficulty: 'advanced',
    applicants: 12,
    requirements: [
      'Clean, cyberpunk-inspired UI design',
      'Token swap functionality with slippage controls',
      'Liquidity pool management dashboard',
      'Wallet connection (MetaMask, WalletConnect)',
      'Test coverage > 80%'
    ],
    tags: ['web3', 'defi', 'dex', 'frontend']
  },
  {
    id: 'bounty-2',
    title: 'Smart Contract Security Audit',
    description: `## Scope
Comprehensive security audit of our DeFi lending protocol smart contracts.

## Contracts to Audit
- LendingPool.sol (~500 lines)
- CollateralManager.sol (~300 lines)
- InterestRateModel.sol (~200 lines)
- Governance.sol (~400 lines)

## Expected Deliverables
- Detailed audit report
- Severity classification of findings
- Recommendations for fixes
- Follow-up review after fixes`,
    shortDescription: 'Perform a comprehensive security audit of DeFi lending protocol smart contracts.',
    reward: 15000,
    currency: 'USDC',
    deadline: '2026-04-30',
    status: 'open',
    category: 'Security',
    skills: ['Solidity', 'Security Audit', 'DeFi', 'Smart Contracts'],
    poster: { ...mockUsers[0], totalBounties: 12 },
    submissions: [],
    createdAt: '2026-03-10',
    difficulty: 'expert',
    applicants: 5,
    requirements: [
      'Detailed audit report with severity classification',
      'Full review of all 4 contracts (~1400 lines total)',
      'Recommendations for fixes',
      'Follow-up review after fixes applied'
    ],
    tags: ['security', 'audit', 'defi', 'smart-contracts']
  },
  {
    id: 'bounty-3',
    title: 'NFT Collection Art Design',
    description: `## Project
Design a 10,000 piece generative NFT collection with a cyberpunk theme.

## Requirements
- Base character designs (5 variations)
- Trait layers (hair, eyes, accessories, backgrounds, etc.)
- At least 150 unique traits across all categories
- Rarity distribution plan
- Preview mockups of final combinations

## Style Guide
- Neon color palette
- Futuristic/dystopian aesthetic
- High detail suitable for PFP use`,
    shortDescription: 'Design a 10K generative NFT collection with cyberpunk aesthetics and 150+ traits.',
    reward: 8000,
    currency: 'USDC',
    deadline: '2026-05-01',
    status: 'in-progress',
    category: 'Design',
    skills: ['Illustration', 'NFT', 'Generative Art', 'Character Design'],
    poster: { ...mockUsers[2], totalBounties: 34 },
    submissions: [
      {
        id: 'sub-1',
        bountyId: 'bounty-3',
        hunter: mockUsers[1],
        status: 'pending',
        submittedAt: '2026-03-15',
        description: 'Initial character concepts and trait breakdown attached.',
        attachments: ['concepts.pdf', 'traits-preview.zip']
      }
    ],
    createdAt: '2026-02-20',
    difficulty: 'intermediate',
    applicants: 23,
    requirements: [
      'Base character designs (5 variations)',
      'At least 150 unique traits across all categories',
      'Rarity distribution plan',
      'Preview mockups of final combinations'
    ],
    tags: ['nft', 'art', 'generative', 'cyberpunk']
  },
  {
    id: 'bounty-4',
    title: 'Write Technical Documentation',
    description: `## Overview
Create comprehensive technical documentation for our SDK.

## Scope
- API reference documentation
- Getting started guides
- Code examples in multiple languages
- Integration tutorials
- Troubleshooting guides

## Languages
- JavaScript/TypeScript
- Python
- Rust`,
    shortDescription: 'Create comprehensive SDK documentation with API references and tutorials.',
    reward: 2500,
    currency: 'USDC',
    deadline: '2026-04-01',
    status: 'open',
    category: 'Content',
    skills: ['Technical Writing', 'Documentation', 'API', 'Developer Relations'],
    poster: { ...mockUsers[0], totalBounties: 12 },
    submissions: [],
    createdAt: '2026-03-12',
    difficulty: 'intermediate',
    applicants: 8,
    requirements: [
      'API reference documentation',
      'Getting started guides',
      'Code examples in JavaScript, Python, and Rust',
      'Integration tutorials'
    ],
    tags: ['documentation', 'technical-writing', 'sdk']
  },
  {
    id: 'bounty-5',
    title: 'Cross-chain Bridge Development',
    description: `## Project
Build a cross-chain token bridge supporting Ethereum, Polygon, and Arbitrum.

## Features
- Secure token locking/minting mechanism
- Multi-sig validation
- Fee estimation and optimization
- Transaction status tracking
- Admin dashboard for monitoring`,
    shortDescription: 'Develop a secure cross-chain bridge supporting ETH, Polygon, and Arbitrum.',
    reward: 25000,
    currency: 'USDC',
    deadline: '2026-06-01',
    status: 'open',
    category: 'Development',
    skills: ['Solidity', 'Cross-chain', 'Smart Contracts', 'Security'],
    poster: { ...mockUsers[2], totalBounties: 34 },
    submissions: [],
    createdAt: '2026-03-08',
    difficulty: 'expert',
    applicants: 3,
    requirements: [
      'Secure token locking/minting mechanism',
      'Multi-sig validation for bridge operations',
      'Fee estimation and optimization',
      'Transaction status tracking',
      'Admin dashboard for monitoring'
    ],
    tags: ['cross-chain', 'bridge', 'defi', 'security']
  },
  {
    id: 'bounty-6',
    title: 'Community Management Bot',
    description: `## Overview
Create a Discord bot for community management with Web3 features.

## Features
- Wallet verification and role assignment
- NFT holder verification
- Announcement scheduling
- Moderation tools
- Analytics dashboard`,
    shortDescription: 'Build a Discord bot with wallet verification, NFT gating, and moderation tools.',
    reward: 3000,
    currency: 'USDC',
    deadline: '2026-04-10',
    status: 'completed',
    category: 'Development',
    skills: ['Discord.js', 'Node.js', 'Web3', 'Bot Development'],
    poster: { ...mockUsers[0], totalBounties: 12 },
    submissions: [
      {
        id: 'sub-2',
        bountyId: 'bounty-6',
        hunter: mockUsers[1],
        status: 'approved',
        submittedAt: '2026-03-05',
        description: 'Fully functional bot with all requested features.',
        attachments: ['bot-source.zip', 'documentation.md']
      }
    ],
    createdAt: '2026-02-15',
    difficulty: 'intermediate',
    applicants: 15,
    requirements: [
      'Wallet verification and role assignment',
      'NFT holder verification',
      'Announcement scheduling',
      'Moderation tools',
      'Analytics dashboard'
    ],
    tags: ['discord', 'bot', 'community', 'web3']
  }
]

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 10000,
    currency: 'USDC',
    timestamp: '2026-03-15T10:30:00Z',
    status: 'completed',
    description: 'Wallet funding',
    txHash: '0xabc...123'
  },
  {
    id: 'tx-2',
    type: 'bounty-paid',
    amount: 3000,
    currency: 'USDC',
    timestamp: '2026-03-14T15:45:00Z',
    status: 'completed',
    description: 'Community Management Bot bounty payment',
    txHash: '0xdef...456'
  },
  {
    id: 'tx-3',
    type: 'bounty-received',
    amount: 2500,
    currency: 'USDC',
    timestamp: '2026-03-10T09:00:00Z',
    status: 'completed',
    description: 'Logo redesign bounty reward',
    txHash: '0xghi...789'
  },
  {
    id: 'tx-4',
    type: 'withdrawal',
    amount: 1500,
    currency: 'USDC',
    timestamp: '2026-03-08T14:20:00Z',
    status: 'completed',
    description: 'Withdrawal to external wallet',
    txHash: '0xjkl...012'
  }
]

export const categories = [
  'Development',
  'Design',
  'Security',
  'Content',
  'Marketing',
  'Research',
  'Community'
]

export const skills = [
  'React',
  'TypeScript',
  'Solidity',
  'Rust',
  'Python',
  'Web3',
  'Smart Contracts',
  'Security Audit',
  'UI/UX',
  'Figma',
  'Technical Writing',
  'NFT',
  'DeFi',
  'Cross-chain'
]
