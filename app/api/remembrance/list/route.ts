import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: List remembrance wikis for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creator_id = searchParams.get('creator_id');

    if (!creator_id) {
      return NextResponse.json(
        { error: 'creator_id required' },
        { status: 400 }
      );
    }

    // Fetch remembrance wikis with tags
    const { data: wikis, error } = await supabaseAdmin
      .from('remembrance_wikis')
      .select(`
        *,
        tags:remembrance_tags(*)
      `)
      .eq('creator_id', creator_id)
      .eq('is_public', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      wikis: wikis || [],
    });
  } catch (error: any) {
    console.error('Error fetching remembrance wikis:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
