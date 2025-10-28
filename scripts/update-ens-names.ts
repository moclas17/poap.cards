/**
 * Script to fetch and update ENS names for existing users
 * Run with: npx tsx scripts/update-ens-names.ts
 */

import { createClient } from '@supabase/supabase-js'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
try {
  const envPath = join(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')

  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=')

    if (key && value && !process.env[key]) {
      process.env[key] = value
    }
  })

  console.log('✓ Loaded environment variables from .env.local\n')
} catch (error) {
  console.warn('⚠️  Could not load .env.local file, using existing environment variables\n')
}

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Initialize viem public client for ENS resolution
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_MAINNET || 'https://eth.llamarpc.com')
})

/**
 * Fetch ENS name for an Ethereum address
 */
async function getEnsName(address: string): Promise<string | null> {
  try {
    const ensName = await publicClient.getEnsName({
      address: address as `0x${string}`
    })
    return ensName
  } catch (error) {
    console.error(`  ⚠️  Error fetching ENS for ${address}:`, error)
    return null
  }
}

/**
 * Update ENS name for a user in the database
 */
async function updateUserEns(userId: string, address: string, ensName: string | null) {
  const { error } = await supabase
    .from('users')
    .update({ ens: ensName })
    .eq('id', userId)

  if (error) {
    console.error(`  ❌ Failed to update ENS for ${address}:`, error.message)
    return false
  }

  return true
}

/**
 * Main function to update all users
 */
async function main() {
  console.log('🔍 Fetching all users from database...\n')

  // Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, address, ens')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch users:', error.message)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('ℹ️  No users found in database')
    return
  }

  console.log(`📊 Found ${users.length} user(s)\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    console.log(`👤 Processing: ${user.address}`)

    // Skip if ENS already exists
    if (user.ens) {
      console.log(`  ✓  ENS already set: ${user.ens}`)
      skipped++
      continue
    }

    // Fetch ENS name
    console.log('  🔄 Fetching ENS...')
    const ensName = await getEnsName(user.address)

    if (ensName) {
      console.log(`  ✓  Found ENS: ${ensName}`)
      const success = await updateUserEns(user.id, user.address, ensName)

      if (success) {
        console.log('  ✓  Updated in database')
        updated++
      } else {
        failed++
      }
    } else {
      console.log('  ℹ️  No ENS name found')
      skipped++
    }

    console.log('') // Empty line for readability

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📈 Summary:')
  console.log('='.repeat(50))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${users.length}`)
  console.log('='.repeat(50) + '\n')
}

// Run the script
main()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
