import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrphanedData() {
  console.log('🔍 Checking for orphaned data in Supabase database...\n')

  try {
    // Step 1: Get all user IDs from auth.users
    console.log('1. Fetching all user IDs from auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      // Try alternative approach - query the users table directly
      console.log('Trying to query public.users table instead...')
    } else {
      console.log(`Found ${authUsers?.users?.length || 0} users in auth.users`)
    }

    // Step 2: Get all user IDs from public.users table
    console.log('\n2. Fetching all user IDs from public.users table...')
    const { data: publicUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
    
    if (usersError) {
      console.error('Error fetching public.users:', usersError)
    } else {
      console.log(`Found ${publicUsers?.length || 0} users in public.users`)
      const publicUserIds = publicUsers?.map(u => u.id) || []
      
      // Step 3: Get all valuations
      console.log('\n3. Fetching all valuations...')
      const { data: valuations, error: valError } = await supabase
        .from('valuations')
        .select('id, user_id, valuation_name')
      
      if (valError) {
        console.error('Error fetching valuations:', valError)
      } else {
        console.log(`Found ${valuations?.length || 0} valuations`)
        
        // Step 4: Find valuations with non-existent users
        const orphanedValuations = valuations?.filter(v => !publicUserIds.includes(v.user_id)) || []
        console.log(`\n4. Found ${orphanedValuations.length} valuations tied to non-existent users:`)
        
        if (orphanedValuations.length > 0) {
          orphanedValuations.forEach(v => {
            console.log(`   - Valuation ID: ${v.id}, Name: "${v.valuation_name}", User ID: ${v.user_id}`)
          })
          
          // Step 5: Get scenarios for orphaned valuations
          console.log('\n5. Fetching scenarios for orphaned valuations...')
          const orphanedValuationIds = orphanedValuations.map(v => v.id)
          const { data: orphanedScenarios, error: scError } = await supabase
            .from('scenarios')
            .select('id, valuation_id')
            .in('valuation_id', orphanedValuationIds)
          
          if (scError) {
            console.error('Error fetching orphaned scenarios:', scError)
          } else {
            console.log(`   Found ${orphanedScenarios?.length || 0} scenarios tied to orphaned valuations`)
          }
        } else {
          console.log('   No orphaned valuations found!')
        }
      }
    }

    // Step 6: Direct check for any scenarios with non-existent valuation IDs
    console.log('\n6. Checking for scenarios with non-existent valuation IDs...')
    const { data: allValuations, error: allValError } = await supabase
      .from('valuations')
      .select('id')
    
    if (!allValError && allValuations) {
      const allValuationIds = allValuations.map(v => v.id)
      const { data: allScenarios, error: allScError } = await supabase
        .from('scenarios')
        .select('id, valuation_id')
      
      if (!allScError && allScenarios) {
        const orphanedScenarios = allScenarios.filter(s => !allValuationIds.includes(s.valuation_id))
        console.log(`   Found ${orphanedScenarios.length} scenarios with non-existent valuation IDs:`)
        
        if (orphanedScenarios.length > 0) {
          orphanedScenarios.forEach(s => {
            console.log(`   - Scenario ID: ${s.id}, Valuation ID: ${s.valuation_id}`)
          })
        }
      }
    }

    // Step 7: Summary
    console.log('\n' + '='.repeat(50))
    console.log('SUMMARY:')
    console.log('='.repeat(50))
    
    // Count totals
    const { data: totalValuations } = await supabase
      .from('valuations')
      .select('id', { count: 'exact', head: true })
    
    const { data: totalScenarios } = await supabase
      .from('scenarios')
      .select('id', { count: 'exact', head: true })
    
    console.log(`Total valuations in database: ${totalValuations?.count || 0}`)
    console.log(`Total scenarios in database: ${totalScenarios?.count || 0}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the check
checkOrphanedData().then(() => {
  console.log('\n✅ Check completed!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})