# SPEC.md — Algocred Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision

Algocred is a fully decentralized bounty marketplace built on the Algorand blockchain. It allows companies and individuals to post on-chain bounties with ALGO escrow, and hunters (workers) to submit work directly to the blockchain. Reputation and submission metadata are tracked entirely on-chain, ensuring maximum censorship resistance and transparency.

## Goals

1. **Fully Decentralized Bounty Management** — All bounties are created, managed, and paid out via the `AlgocredBountyManager` ARC-56 smart contract on Algorand TestNet.
2. **On-Chain Persistence** — Both financial state (escrow, rewards) and worker submissions (text, URLs) are stored in Algorand Application Boxes.
3. **On-Chain Reputation** — User reputation is derived from leaderboard box storage in the smart contract and displayed live in the Dashboard and Profile pages.
4. **No Centralized Backend** — Zero dependency on traditional databases (Supabase, etc.) or centralized indexing services for core functionality.

## Non-Goals (Out of Scope)

- Mainnet deployment (TestNet only for now)
- Multi-token support (ALGO only, no ASAs)
- Dispute resolution system
- Email or push notifications
- Mobile native app

## Constraints

- Smart contract is the source of truth — `NEXT_PUBLIC_MANAGER_APP_ID` must be set.
- Frontend is Next.js 14 (App Router) with TypeScript.
- All persistent data must live in Algorand Boxes.
- Pera Wallet / `@txnlab/use-wallet-react` for wallet interactions.

## Success Criteria

- [x] Bounty creation submits an atomic group transaction (MBR + app call) to the contract.
- [x] Browse page fetches and displays all on-chain bounties from box storage.
- [x] Detail page shows owner vs. hunter views with correct conditional rendering.
- [x] Hunters can submit work directly to on-chain Box storage.
- [x] Owners can review submissions and trigger `payBounty` on-chain.
- [x] Dashboard and Profile pages display live on-chain stats (posted count, escrowed ALGO, reputation).
- [x] Project builds successfully with `npm run build`.

## User Stories

### As a Bounty Poster (Owner)
- I want to create a bounty with ALGO escrow locked in the smart contract.
- So that hunters trust that the reward is guaranteed.

### As a Bounty Hunter (Worker)
- I want to browse open bounties and submit my work directly to the blockchain.
- So that my contribution is permanent and verifiable without a central database.

### As an Owner reviewing submissions
- I want to see all submissions in a dedicated tab on the detail page, fetched from the blockchain.
- So that I can select a winner and trigger the on-chain payout.

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| AlgocredBountyManager contract | Must-have | App ID from `.env.local` |
| Algorand Application Boxes | Must-have | Used for both Bounties and Submissions |
| Pera Wallet via use-wallet | Must-have | Standard wallet integration |
| Algorand TestNet Indexer | Must-have | Used for prefix-based box enumeration |
| Next.js 14 App Router | Must-have | Frontend framework |

---

*Last updated: 2026-04-16*
