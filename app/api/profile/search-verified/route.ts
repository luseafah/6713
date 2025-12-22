import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Search verified users with signature phrases
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      );
    }

    // Search verified users by username
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, signature_phrase, verified_at')
      .not('verified_at', 'is', null) // Only verified users
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      profiles: profiles || [],
    });
  } catch (error: any) {
    console.error('Error searching verified profiles:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
