import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read environment variables from .env.local directly
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const content = readFileSync(envPath, 'utf8')
    const env = {}
    
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let value = match[2] || ''
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        }
        
        env[key] = value
      }
    })
    
    return env
  } catch (error) {
    console.error('Error reading .env.local:', error.message)
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing')
  process.exit(1)
}

console.log('✅ Supabase credentials loaded successfully')
console.log('URL:', supabaseUrl.substring(0, 30) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrphanedData() {
  console.log('\n🔍 Checking for orphaned data in Supabase database...\n')

  try {
    // Step 1: Get all user IDs from public.users table
    console.log('1. Fetching all user IDs from public.users table...')
    const { data: publicUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
    
    if (usersError) {
      console.error('Error fetching public.users:', usersError.message)
      console.log('Trying to continue with empty user list...')
      var publicUserIds = []
    } else {
      console.log(`Found ${publicUsers?.length || 0} users in public.users`)
      var publicUserIds = publicUsers?.map(u => u.id) || []
    }

    // Step 2: Get all valuations
    console.log('\n2. Fetching all valuations...')
    const { data: valuations, error: valError } = await supabase
      .from('valuations')
      .select('id, user_id, valuation_name, created_at')
      .order('created_at', { ascending: false })
    
    if (valError) {
      console.error('Error fetching valuations:', valError.message)
      console.log('Cannot proceed without valuations data')
      return
    }
    
    console.log(`Found ${valuations?.length || 0} valuations`)
    
    // Step 3: Find valuations with non-existent users
    const orphanedValuations = valuations?.filter(v => !publicUserIds.includes(v.user_id)) || []
    console.log(`\n3. Found ${orphanedValuations.length} valuations tied to non-existent users:`)
    
    if (orphanedValuations.length > 0) {
      orphanedValuations.forEach(v => {
        const date = new Date(v.created_at).toLocaleDateString()
        console.log(`   - ID: ${v.id}, Name: "${v.valuation_name}", User ID: ${v.user_id}, Created: ${date}`)
      })
      
      // Step 4: Get scenarios for orphaned valuations
      console.log('\n4. Fetching scenarios for orphaned valuations...')
      const orphanedValuationIds = orphanedValuations.map(v => v.id)
      const { data: orphanedScenarios, error: scError } = await supabase
        .from('scenarios')
        .select('id, valuation_id, scenario_name')
        .in('valuation_id', orphanedValuationIds)
      
      if (scError) {
        console.error('Error fetching orphaned scenarios:', scError.message)
      } else {
        console.log(`   Found ${orphanedScenarios?.length || 0} scenarios tied to orphaned valuations`)
        if (orphanedScenarios?.length > 0) {
          orphanedScenarios.forEach(s => {
            console.log(`     - Scenario ID: ${s.id}, Name: "${s.scenario_name}", Valuation ID: ${s.valuation_id}`)
          })
        }
      }
    } else {
      console.log('   No orphaned valuations found!')
    }

    // Step 5: Direct check for any scenarios with non-existent valuation IDs
    console.log('\n5. Checking for scenarios with non-existent valuation IDs...')
    const allValuationIds = valuations.map(v => v.id)
    const { data: allScenarios, error: allScError } = await supabase
      .from('scenarios')
      .select('id, valuation_id, scenario_name')
      .limit(1000) // Limit to avoid too much data
    
    if (allScError) {
      console.error('Error fetching all scenarios:', allScError.message)
    } else {
      const trulyOrphanedScenarios = allScenarios.filter(s => !allValuationIds.includes(s.valuation_id))
      console.log(`   Found ${trulyOrphanedScenarios.length} scenarios with non-existent valuation IDs:`)
      
      if (trulyOrphanedScenarios.length > 0) {
        trulyOrphanedScenarios.forEach(s => {
          console.log(`   - Scenario ID: ${s.id}, Name: "${s.scenario_name}", Valuation ID: ${s.valuation_id}`)
        })
      } else {
        console.log('   No truly orphaned scenarios found!')
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60))
    console.log('DATABASE SUMMARY:')
    console.log('='.repeat(60))
    
    // Count totals
    const { count: totalValuationsCount } = await supabase
      .from('valuations')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalScenariosCount } = await supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total users: ${totalUsersCount || 0}`)
    console.log(`Total valuations: ${totalValuationsCount || 0}`)
    console.log(`Total scenarios: ${totalScenariosCount || 0}`)
    console.log(`Orphaned valuations: ${orphanedValuations.length}`)
    console.log(`Orphaned scenarios: ${trulyOrphanedScenarios?.length || 0}`)
    
    if (orphanedValuations.length > 0) {
      console.log('\n⚠️  RECOMMENDATION: Consider cleaning up orphaned data:')
      console.log('   - Delete orphaned valuations and their scenarios')
      console.log('   - Or reassign them to existing users if appropriate')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message)
    console.error(error.stack)
  }
}

// Run the check
checkOrphanedData().then(() => {
  console.log('\n✅ Check completed!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})