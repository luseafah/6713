const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use environment variables instead of hardcoded credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrations = [
  'database/INIT-MASTER-SCHEMA.sql',
  'database/migration-wall-chat-heartbeat.sql',
  'database/migration-hamburger-search.sql',
  'database/migration-profile-page.sql',
  'database/migration-pulse-chat.sql'
];

async function runMigration(filePath) {
  console.log(`\n🔄 Running: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error in ${filePath}:`, error);
      return false;
    }
    
    console.log(`✅ Success: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to read/execute ${filePath}:`, err.message);
    return false;
  }
}

async function deploy() {
  console.log('🚀 Starting migration deployment...\n');
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      console.error('\n⚠️  Migration failed. Fix errors before continuing.');
      process.exit(1);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between migrations
  }
  
  console.log('\n✅ All migrations deployed successfully!');
}

deploy();
