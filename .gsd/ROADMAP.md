# ROADMAP.md — Algocred Development Phases

> **Current Phase**: Phase 5 — Final Polish & Production Readiness
>
> Reference: [SPEC.md](./SPEC.md)

---

## Phase 1 — Foundation ✅ COMPLETE

**Objective:** Bootstrap the Next.js project with Algorand wallet integration and the core smart contract client.

| Task | Status | Notes |
|------|--------|-------|
| Scaffold Next.js 14 project | ✅ | App Router, TypeScript |
| Install `@txnlab/use-wallet-react` | ✅ | Pera Wallet support |
| Style wallet modal to match cyberpunk theme | ✅ | globals.css overrides |
| Generate `AlgocredBountyManagerClient` from ARC-56 | ✅ | In `contracts/` directory |
| Configure `.env.local` with App ID and Supabase keys | ✅ | |

---

## Phase 2 — Core Bounty Flows ✅ COMPLETE

**Objective:** Enable full on-chain bounty lifecycle: create → browse → view → submit → payout.

| Task | Status | Notes |
|------|--------|-------|
| Bounty creation form (5-step wizard) | ✅ | `/bounties/create` |
| Atomic group transaction (MBR + app call) | ✅ | Reward + 1 ALGO box MBR |
| Pre-flight balance check | ✅ | Prevents overspend errors |
| Live bounty feed from Algorand Indexer | ✅ | Box decoding via `ABIType.from()` |
| Bounty detail page — dual view (Owner / Hunter) | ✅ | `/bounties/[id]` |
| On-chain submission workflow | ✅ | Moved from Supabase to Box Storage |
| Owner review tab with `payBounty` on-chain | ✅ | Uses `AlgocredBountyManagerClient` |
| Save for Later (LocalStorage) | ✅ | |
| Copy Magic Link (Clipboard API) | ✅ | |

---

## Phase 3 — Live Stats & Profile ✅ COMPLETE

**Objective:** Replace all mock data with live on-chain statistics.

| Task | Status | Notes |
|------|--------|-------|
| Dashboard — live bounties posted count | ✅ | From box enumeration |
| Dashboard — live escrowed ALGO | ✅ | Summed from poster's boxes |
| Dashboard — on-chain activity feed | ✅ | Maps posted bounties to events |
| Profile — live reputation from leaderboard box | ✅ | `algosdk.decodeUint64` |
| Profile — live activity timeline | ✅ | |
| Fix profile page missing `'use client'` directive | ✅ | |

---

## Phase 4 — Decentralization Hardening ✅ COMPLETE

**Objective:** Remove all external dependencies (Supabase) and move metadata entirely on-chain.

| Task | Status | Notes |
|------|--------|-------|
| Refactor `submitWork` to use Box storage | ✅ | Key: `bountyId + hunterAddress` |
| Remove `@supabase/supabase-js` from project | ✅ | Package uninstalled |
| Delete `lib/supabase.ts` | ✅ | |
| Clean up `.env.local` of legacy keys | ✅ | |
| Implement on-chain submission fetching | ✅ | Decodes ABI structs from boxes |

---

## Phase 5 — Final Polish & Production Readiness 🔜 NEXT

**Objective:** Harden the app for demo/submission, add missing UX flows, and ensure build passes cleanly.

| Task | Status | Priority |
|------|--------|----------|
| Verify `npm run build` passes with zero errors | ✅ | High |
| Fix remaining TypeScript lint errors | ✅ | High |
| Add loading skeletons to profile/dashboard cards | 🔜 | Medium |
| Empty state for "no submissions yet" | 🔜 | Medium |
| Deadline display: show actual date, not just hours | 🔜 | Medium |
| Handle expired bounties gracefully in the feed | 🔜 | Low |
| Add toast notifications for Save/Copy actions | 🔜 | Low |

---

*Last updated: 2026-04-16*
