# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

POAP Card is a Next.js 14+ dApp for dispensing POAPs using NFC cards with NTAG424 DNA chips and SDM (Secure Dynamic Messaging). The app runs entirely on web (no mobile app) and uses Reown (AppKit + wagmi) for all web3 functionality and authentication.

**Domain**: https://0xpo.app
**Public tap route**: `/r?uid=<UID>&ctr=<CTR>&cmac=<CMAC>`

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript, Node.js runtime for APIs)
- **UI**: Tailwind CSS with pastel color palette: C #EAC9F8, A #D8F2C8, R #B5AEFF, D #FFEDD6, base purple #6E56CF
- **Database**: Supabase (Postgres) with Row Level Security (RLS)
- **Web3**: Reown AppKit + @reown/appkit-adapter-wagmi + viem (STRICT requirement - no other connectors)
- **Auth**: Reown wallet connection + SIWE + JWT cookies (HttpOnly, 12h)
- **NFC**: NTAG424 DNA with SDM verification

## Development Commands

```bash
# Project setup (when initializing)
npm install # Install dependencies

# Development
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server

# Code quality
npm run lint      # Lint code with Next.js ESLint
npm run typecheck # TypeScript checking with tsc --noEmit

# Note: No formal test setup currently configured
```

## Database Schema (Supabase)

Core tables with RLS enabled:
- `users` - User profiles (address, ENS)
- `drops` - POAP event collections (owner_address, name, poap_event_id)
- `poap_codes` - Individual POAP claim URLs (claim_url, qr_hash, is_used)
- `cards` - NFC cards (ntag_uid, owner_address)
- `card_drop_assignments` - Links cards to drops
- `card_reads` - SDM tap events (sdm_ctr, sdm_cmac, state: reserved/served/minted/invalid)
- `poap_tokens` - OAuth2 access tokens for POAP API (access_token, expires_at)

**Important**: All mutations use Supabase Service Role Key server-side. Client uses anon key for reads only.

## Architecture

### Authentication Flow
1. Reown AppKit connects wallet
2. SIWE message signing via `GET /api/auth/nonce` + `POST /api/auth/verify`
3. JWT issued in HttpOnly cookie (12h expiry)
4. `requireAuth()` helper validates JWT on protected routes

### NFC Tap Flow (SDM)
1. NTAG424 generates unique URL: `/r?uid=X&ctr=Y&cmac=Z`
2. Server verifies SDM (mock or strict AES-CMAC with K_MASTER_HEX)
3. Idempotent by `sdm_cmac` - prevents double-claiming
4. States: `reserved` → `served` → `minted`

### Core APIs
- **Auth**: `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/auto`, `/api/auth/logout`, `/api/auth/me`
- **Drops**: `/api/drops/me`, `/api/drops/create`, `/api/drops/preview`, `/api/drops/[id]/codes`
- **Cards**: `/api/cards/claim`, `/api/cards/my-cards`, `/api/cards/[cardId]`, `/api/cards/[cardId]/assign-drop`
- **Card Assignments**: `/api/card-assignments/[id]`
- **NFC Tap**: `/api/r` (public, force-dynamic, Node.js runtime)
- **Claim**: `/api/claim/confirm` (marks POAP as minted)

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://0xpo.app
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET=supersecret

# SDM/NFC
SDM_VERIFY_MODE=mock            # mock | strict
K_MASTER_HEX=00000000000000000000000000000000  # 16 bytes hex

# POAP API
POAP_CLIENT_ID=y45LrIpUGVgj6NIIc795ltl8qzFvBCFw
POAP_CLIENT_SECRET=01mtLNDKeKfn-tSU-D88c4C82jw07Vwel0necy7NfGw27zalqz39ovLzy5keg5sl
POAP_API_KEY=4iwIMIpNiWkYSjcDszseg8eDTiFf5afbJ89CGv1syDiZjKcoSMov2rOF8Ulb5T4nUHQWtCpfbo7hi4Tgyuitzs79A8aL0Yrc34PBBT1cKFhOTQGpZSxZGKMuPxX6zHFH

# Cron Security
CRON_SECRET=your-secret-here

# Optional
RPC_MAINNET=
```

## Key Pages (App Router)

- `/` - Home with Reown connect button
- `/drops` - User's POAP drops management
- `/drops/[id]` - Drop details and codes
- `/cards` - NFC card management and drop assignment
- `/r/route.ts` - Public NFC tap handler (force-dynamic, Node.js runtime)

## Critical Implementation Requirements

### Reown Integration (STRICT)
- Use ONLY Reown AppKit for wallet connection
- No email login, no other connectors
- All web3 interactions through wagmi/viem via Reown
- Client Provider setup in `app/providers.tsx`

### Security
- JWT HttpOnly cookies (12h)
- Rate limiting on `/api/r` by IP and UID
- Strict idempotency via unique `sdm_cmac`
- Service Role Key server-side only
- SDM verification for NFC security

### Database
- RLS policies based on `owner_address` from JWT claims
- Server-side mutations only (Service Role Key)
- Transactional POAP code reservation to prevent race conditions

## Error Handling

Common SDM tap responses:
- `unclaimed_card` - UID not in cards table
- `unassigned_drop` - Card has no drop assigned
- `no_codes` - Drop has no available POAP codes
- `sdm_invalid` - SDM verification failed
- `served` - Code reserved, return claim URL
- `minted` - Already claimed