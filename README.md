# POAP Card

A Next.js 14+ dApp for dispensing POAPs using NFC cards with NTAG424 DNA chips and SDM (Secure Dynamic Messaging).

## Features

- 🎫 **POAP Distribution**: Create drops and manage POAP claim codes
- 📱 **NFC Cards**: Use NTAG424 DNA cards with secure dynamic messaging
- 🔒 **Secure Tapping**: Cryptographically secure NFC taps prevent cloning
- 🌐 **Web3 Integration**: Reown AppKit for wallet connection and SIWE auth
- 💾 **Supabase Backend**: Postgres database with Row Level Security

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript)
- **UI**: Tailwind CSS with custom POAP Card color palette
- **Database**: Supabase (Postgres) with RLS
- **Web3**: Reown AppKit + wagmi + viem
- **Auth**: SIWE + JWT cookies (HttpOnly, 12h)
- **NFC**: NTAG424 DNA with SDM verification

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository>
   cd poapcard
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Reown Project ID and Supabase credentials.

3. **Set up database**:
   - Create a new Supabase project
   - Run `database/schema.sql` in the SQL Editor
   - Run `database/seed.sql` for demo data

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Setup

### Reown Configuration
1. Visit [Reown Cloud](https://cloud.reown.com)
2. Create a new project
3. Copy the Project ID to `NEXT_PUBLIC_REOWN_PROJECT_ID`

### Supabase Configuration
1. Create a new project at [Supabase](https://supabase.com)
2. Get your URL and keys from Settings > API
3. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

The app uses 6 main tables:
- `users` - User profiles (address, ENS)
- `drops` - POAP event collections
- `poap_codes` - Individual claim URLs
- `cards` - NFC cards (NTAG UID, owner)
- `card_drop_assignments` - Links cards to drops
- `card_reads` - SDM tap events and states

## NFC Flow

1. **Card Setup**: Claim card ownership by UID, assign to a drop
2. **NFC Tap**: NTAG424 generates secure URL: `/r?uid=X&ctr=Y&cmac=Z`
3. **Verification**: Server verifies SDM and dispenses POAP
4. **States**: `reserved` → `served` → `minted`

## API Endpoints

### Authentication
- `GET /api/auth/nonce` - Get SIWE nonce
- `POST /api/auth/verify` - Verify signature and login

### Drops
- `GET /api/drops/me` - Get user's drops with stats

### Cards
- `POST /api/cards/claim` - Claim card ownership

### NFC Tapping
- `GET /api/r` - Process NFC tap (SDM verification)
- `GET /r` - Public tap route (redirects to claim URL)

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Lint code
npm run typecheck  # TypeScript checking
```

## Security Features

- **SDM Verification**: NTAG424 cryptographic authentication
- **JWT Auth**: HttpOnly cookies with 12h expiry
- **RLS Policies**: Database-level access control
- **Idempotency**: Prevents double-claiming via unique CMAC
- **Rate Limiting**: Planned for production deployment

## Demo

Test the system with:
- **Demo Card UID**: `DEMOUID1234`
- **Demo URL**: `/r?uid=DEMOUID1234&ctr=1&cmac=MOCK`

## Deployment

Designed for deployment on:
- **Frontend**: Vercel (automatic from Git)
- **Database**: Supabase (managed Postgres)
- **Domain**: Configure for `https://0xpo.app`

## License

MIT