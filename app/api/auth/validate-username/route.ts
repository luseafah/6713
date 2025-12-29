import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username || /[^a-zA-Z0-9_]/.test(username)) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  if (data) {
    return NextResponse.json({ available: false });
  }
  return NextResponse.json({ available: true });
}
