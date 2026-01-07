import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Get recent connections (last 3 people who worked with this user)
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .rpc('get_recent_connections', { user_uuid: userId });

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError);
      return NextResponse.json({ error: connectionsError.message }, { status: 500 });
    }

    // Get involvement count
    const { data: involvementCount, error: countError } = await supabaseAdmin
      .rpc('get_involvement_count', { user_uuid: userId });

    if (countError) {
      console.error('Error fetching involvement:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    return NextResponse.json({
      connections: connections || [],
      involvement_count: involvementCount || 0
    });
  } catch (error: any) {
    console.error('Connections API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
