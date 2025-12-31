import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json();
  let email = identifier;
  // If not an email, treat as username and look up email
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier)) {
    let username = identifier;
    if (username && !username.startsWith('@')) {
      username = '@' + username.replace(/^@+/, '');
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();
    if (error || !data?.email) {
      return NextResponse.json({ error: 'No user found with that username' }, { status: 404 });
    }
    email = data.email;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json({ user: data.user });
}
