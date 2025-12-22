#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'vsxrvrtnwvslmuvykhhy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeHJ2cnRud3ZzbG11dnlraGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxODU3ODEsImV4cCI6MjA4MTc2MTc4MX0.OUhpumN1urS3fL7NOjz4S_e8L3waR_agQd8bzATu09w';

const migrations = [
  'INIT-MASTER-SCHEMA.sql',
  'migration-wall-chat-heartbeat.sql',
  'migration-hamburger-search.sql',
  'migration-profile-page.sql',
  'migration-pulse-chat.sql'
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject({ success: false, error: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runMigration(filename) {
  console.log(`\n🔄 Running: ${filename}`);
  
  try {
    const filePath = path.join(__dirname, '..', 'database', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by statement delimiter and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length < 10) continue; // Skip tiny statements
      
      try {
        await executeSQL(stmt + ';');
        process.stdout.write('.');
      } catch (err) {
        console.error(`\n   ❌ Statement ${i + 1} failed:`, err.error || err.message);
        if (err.error) {
          console.error(`   Status: ${err.status}`);
        }
        // Continue on error for now
      }
    }
    
    console.log(`\n✅ Completed: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Error reading ${filename}:`, err.message);
    return false;
  }
}

async function deploy() {
  console.log('🚀 Starting database migration deployment...');
  console.log('📡 Target: ' + SUPABASE_URL);
  console.log('');
  
  for (const migration of migrations) {
    await runMigration(migration);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Deployment complete!');
  console.log('\nNext steps:');
  console.log('1. Verify in Supabase Dashboard: https://supabase.com/dashboard/project/vsxrvrtnwvslmuvykhhy');
  console.log('2. Test sign up flow in your app');
  console.log('3. Deploy to Vercel');
}

deploy().catch(err => {
  console.error('\n❌ Deployment failed:', err);
  process.exit(1);
});
