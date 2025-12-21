import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Get random connection
    const { data: randomUser, error } = await supabaseAdmin
      .rpc('get_random_connection', { user_uuid: userId });

    if (error) {
      console.error('Error fetching random connection:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!randomUser || randomUser.length === 0) {
      return NextResponse.json({ error: 'No connections found' }, { status: 404 });
    }

    return NextResponse.json({ user: randomUser[0] });
  } catch (error: any) {
    console.error('Random connection API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
