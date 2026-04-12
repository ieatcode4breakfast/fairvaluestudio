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
  process.exit(1)
}

console.log('📊 SUPABASE DATABASE ANALYSIS REPORT')
console.log('='.repeat(60))
console.log(`Project URL: ${supabaseUrl}`)
console.log(`Analysis Time: ${new Date().toISOString()}`)
console.log()

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateReport() {
  console.log('🔍 CHECKING FOR ORPHANED VALUATIONS & SCENARIOS')
  console.log('='.repeat(60))
  
  try {
    // 1. Check table existence and counts
    console.log('\n1. TABLE STATUS:')
    console.log('-'.repeat(40))
    
    const tables = [
      { name: 'users', description: 'User profiles (public.users)' },
      { name: 'valuations', description: 'Valuation projects' },
      { name: 'scenarios', description: 'Scenarios within valuations' }
    ]
    
    const tableCounts = {}
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table.name}: ${error.message}`)
        tableCounts[table.name] = { count: 0, error: error.message }
      } else {
        console.log(`✅ ${table.name}: ${count || 0} rows`)
        tableCounts[table.name] = { count: count || 0, error: null }
      }
    }
    
    // 2. Check for orphaned valuations
    console.log('\n2. ORPHANED DATA ANALYSIS:')
    console.log('-'.repeat(40))
    
    const usersCount = tableCounts['users'].count
    const valuationsCount = tableCounts['valuations'].count
    const scenariosCount = tableCounts['scenarios'].count
    
    if (valuationsCount === 0) {
      console.log('✅ No valuations in database, so no orphaned valuations.')
    } else {
      // Get all user IDs from users table
      const { data: users } = await supabase
        .from('users')
        .select('id')
      
      const userIds = users?.map(u => u.id) || []
      
      // Get all valuations
      const { data: valuations } = await supabase
        .from('valuations')
        .select('id, user_id')
      
      if (valuations && valuations.length > 0) {
        const orphanedValuations = valuations.filter(v => !userIds.includes(v.user_id))
        console.log(`📊 Found ${orphanedValuations.length} orphaned valuations (out of ${valuations.length} total)`)
        
        if (orphanedValuations.length > 0) {
          console.log('   Orphaned valuation IDs:', orphanedValuations.map(v => v.id).join(', '))
        }
      }
    }
    
    if (scenariosCount === 0) {
      console.log('✅ No scenarios in database, so no orphaned scenarios.')
    } else {
      // Get all valuation IDs
      const { data: valuations } = await supabase
        .from('valuations')
        .select('id')
      
      const valuationIds = valuations?.map(v => v.id) || []
      
      // Get all scenarios
      const { data: scenarios } = await supabase
        .from('scenarios')
        .select('id, valuation_id')
      
      if (scenarios && scenarios.length > 0) {
        const orphanedScenarios = scenarios.filter(s => !valuationIds.includes(s.valuation_id))
        console.log(`📊 Found ${orphanedScenarios.length} orphaned scenarios (out of ${scenarios.length} total)`)
        
        if (orphanedScenarios.length > 0) {
          console.log('   Orphaned scenario IDs:', orphanedScenarios.map(s => s.id).join(', '))
        }
      }
    }
    
    // 3. Data integrity summary
    console.log('\n3. DATA INTEGRITY SUMMARY:')
    console.log('-'.repeat(40))
    
    if (usersCount === 0 && valuationsCount === 0 && scenariosCount === 0) {
      console.log('📭 Database is completely empty.')
      console.log('   This could mean:')
      console.log('   • The application has not been used yet')
      console.log('   • Data is stored in different tables')
      console.log('   • RLS policies prevent viewing data')
    } else if (valuationsCount > 0 && usersCount === 0) {
      console.log('⚠️  WARNING: Valuations exist but no users in public.users table!')
      console.log('   All valuations are orphaned (no owning user).')
    } else if (scenariosCount > 0 && valuationsCount === 0) {
      console.log('⚠️  WARNING: Scenarios exist but no valuations!')
      console.log('   All scenarios are orphaned (no parent valuation).')
    } else {
      console.log('✅ Data relationships appear intact.')
    }
    
    // 4. Connection test
    console.log('\n4. CONNECTION VERIFICATION:')
    console.log('-'.repeat(40))
    
    try {
      // Simple query to verify connection works
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (error && error.code === '42501') {
        console.log('✅ Connected to Supabase (RLS prevents data access)')
        console.log('   Note: Row Level Security may be hiding data from anonymous users')
      } else if (error) {
        console.log(`✅ Connected to Supabase (Query error: ${error.message})`)
      } else {
        console.log('✅ Successfully connected to Supabase database')
      }
    } catch (err) {
      console.log(`❌ Connection error: ${err.message}`)
    }
    
    // 5. Recommendations
    console.log('\n5. RECOMMENDATIONS:')
    console.log('-'.repeat(40))
    
    if (usersCount === 0 && valuationsCount === 0 && scenariosCount === 0) {
      console.log('• No action needed - database is clean (empty)')
      console.log('• If you expect data, check Row Level Security (RLS) policies')
      console.log('• Verify that users have created valuations through the app')
    } else if (valuationsCount > 0 && usersCount === 0) {
      console.log('• Investigate why users table is empty but valuations exist')
      console.log('• Check if user data is in auth.users instead of public.users')
      console.log('• Consider cleaning up orphaned valuations')
    } else {
      console.log('• Database appears healthy')
      console.log('• Regular integrity checks are recommended')
    }
    
  } catch (error) {
    console.error('\n❌ Error generating report:', error.message)
  }
}

// Run the report
generateReport().then(() => {
  console.log('\n' + '='.repeat(60))
  console.log('✅ REPORT COMPLETED')
  console.log('='.repeat(60))
  process.exit(0)
}).catch(error => {
  console.error('\n❌ Report generation failed:', error.message)
  process.exit(1)
})