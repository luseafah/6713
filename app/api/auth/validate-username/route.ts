import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  
  // Ensure username starts with @
  let normalizedUsername = username;
  if (normalizedUsername && !normalizedUsername.startsWith('@')) {
    normalizedUsername = '@' + normalizedUsername.replace(/^@+/, '');
  }
  
  // Validate format: @ followed by letters, numbers, underscores only
  if (!normalizedUsername || !/^@[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
    return NextResponse.json({ error: 'Username must start with @ and contain only letters, numbers, and underscores' }, { status: 400 });
  }
  
  // Check availability in profiles table (querying auth.users metadata)
  const { data, error } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .eq('raw_user_meta_data->>username', normalizedUsername)
    .single();
  
  if (data) {
    return NextResponse.json({ available: false });
  }
  return NextResponse.json({ available: true });
}
