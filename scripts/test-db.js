// Simple database test script
const { createClient } = require('@supabase/supabase-js')

async function testDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('Testing database connection...')

    // Test 1: Check if cards table exists and has data
    console.log('\n1. Testing cards table:')
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, ntag_uid, owner_address')
      .limit(5)

    if (cardsError) {
      console.error('Cards error:', cardsError)
    } else {
      console.log('Cards found:', cards.length)
      if (cards.length > 0) {
        console.log('Sample card:', cards[0])
      }
    }

    // Test 2: Check if drops table exists and has data
    console.log('\n2. Testing drops table:')
    const { data: drops, error: dropsError } = await supabase
      .from('drops')
      .select('id, name, owner_address')
      .limit(5)

    if (dropsError) {
      console.error('Drops error:', dropsError)
    } else {
      console.log('Drops found:', drops.length)
      if (drops.length > 0) {
        console.log('Sample drop:', drops[0])
      }
    }

    // Test 3: Check if card_drop_assignments table exists
    console.log('\n3. Testing card_drop_assignments table:')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('card_drop_assignments')
      .select('id, card_id, drop_id, assigned_at')
      .limit(5)

    if (assignmentsError) {
      console.error('Assignments error:', assignmentsError)
    } else {
      console.log('Assignments found:', assignments.length)
      if (assignments.length > 0) {
        console.log('Sample assignment:', assignments[0])
      }
    }

    // Test 4: Check if we can do a join query
    console.log('\n4. Testing join query:')
    const { data: joinData, error: joinError } = await supabase
      .from('card_drop_assignments')
      .select(`
        id,
        assigned_at,
        cards (
          id,
          ntag_uid
        )
      `)
      .limit(2)

    if (joinError) {
      console.error('Join query error:', joinError)
    } else {
      console.log('Join query successful, results:', joinData.length)
      if (joinData.length > 0) {
        console.log('Sample join result:', JSON.stringify(joinData[0], null, 2))
      }
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testDatabase()