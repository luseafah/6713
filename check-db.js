const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    // Check if profiles table exists
    console.log('🔍 Checking database setup...\n');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Profiles table error:', profileError.message);
      console.log('   Code:', profileError.code);
      console.log('   Details:', profileError.details);
    } else {
      console.log('✅ Profiles table exists');
      console.log('   Profiles count:', profiles.length);
    }
    
    // Try to check trigger by querying system tables
    const { data: triggerData, error: triggerError } = await supabase.rpc('check_trigger', {});
    
    if (triggerError && triggerError.code === '42883') {
      console.log('⚠️  No trigger check function available - will check manually');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
})();
