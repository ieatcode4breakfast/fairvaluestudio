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

console.log('✅ Supabase credentials loaded')
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
  console.log('\n🔍 Inspecting database schema...\n')

  try {
    // Get table names by trying to select one row from each known table
    const tables = ['users', 'valuations', 'scenarios']
    
    for (const table of tables) {
      console.log(`\nTable: ${table}`)
      console.log('-'.repeat(40))
      
      try {
        // Try to get column info by selecting limited rows
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`  Error: ${error.message}`)
          
          // Try to get just the column names without data
          const { data: data2, error: error2 } = await supabase
            .from(table)
            .select('id')
            .limit(0)
            
          if (!error2) {
            console.log(`  Table exists (has id column)`)
          } else {
            console.log(`  Table might not exist or different error`)
          }
        } else {
          if (data && data.length > 0) {
            const sample = data[0]
            console.log(`  Columns: ${Object.keys(sample).join(', ')}`)
            console.log(`  Sample row keys:`, Object.keys(sample))
            
            // Show a few key values
            const importantKeys = Object.keys(sample).filter(k => 
              k.includes('name') || k.includes('Name') || k.includes('id') || k.includes('Id')
            )
            if (importantKeys.length > 0) {
              console.log(`  Important columns:`)
              importantKeys.forEach(k => {
                console.log(`    - ${k}: ${sample[k]}`)
              })
            }
          } else {
            console.log(`  Table exists but is empty`)
          }
        }
      } catch (err) {
        console.log(`  Exception: ${err.message}`)
      }
    }
    
    // Try to get some actual data counts
    console.log('\n' + '='.repeat(60))
    console.log('DATA COUNTS:')
    console.log('='.repeat(60))
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`${table}: Error - ${error.message}`)
        } else {
          console.log(`${table}: ${count || 0} rows`)
        }
      } catch (err) {
        console.log(`${table}: Exception - ${err.message}`)
      }
    }
    
    // Try to get actual data to understand relationships
    console.log('\n' + '='.repeat(60))
    console.log('SAMPLE DATA ANALYSIS:')
    console.log('='.repeat(60))
    
    // Get some valuations with their user IDs
    try {
      const { data: valuations, error } = await supabase
        .from('valuations')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false })
      
      if (!error && valuations && valuations.length > 0) {
        console.log('\nSample valuations:')
        valuations.forEach((v, i) => {
          console.log(`  ${i+1}. ID: ${v.id}, User: ${v.user_id || v.userId || 'unknown'}, Name: ${v.valuationName || v.valuation_name || 'unnamed'}`)
        })
      }
    } catch (err) {
      console.log('Could not fetch valuations:', err.message)
    }
    
    // Get some users
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      if (!error && users && users.length > 0) {
        console.log('\nSample users:')
        users.forEach((u, i) => {
          console.log(`  ${i+1}. ID: ${u.id}, Username: ${u.username || 'unknown'}, Email: ${u.email || 'unknown'}`)
        })
      } else if (users && users.length === 0) {
        console.log('\nUsers table is empty')
      }
    } catch (err) {
      console.log('Could not fetch users:', err.message)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message)
  }
}

// Run the inspection
inspectSchema().then(() => {
  console.log('\n✅ Schema inspection completed!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Inspection failed:', error.message)
  process.exit(1)
})