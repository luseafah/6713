import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, user_id } = body;

    // Check if user already reacted
    const { data: existing } = await supabaseAdmin
      .from('wall_reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      // Remove reaction
      await supabaseAdmin
        .from('wall_reactions')
        .delete()
        .eq('id', existing.id);

      return NextResponse.json({ action: 'removed' });
    } else {
      // Add reaction
      await supabaseAdmin
        .from('wall_reactions')
        .insert({
          message_id,
          user_id,
        });

      return NextResponse.json({ action: 'added' });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const message_id = searchParams.get('message_id');

    if (!message_id) {
      return NextResponse.json(
        { error: 'message_id required' },
        { status: 400 }
      );
    }

    const { data: reactions, error } = await supabaseAdmin
      .from('wall_reactions')
      .select('*')
      .eq('message_id', message_id);

    if (error) throw error;

    return NextResponse.json({ 
      count: reactions.length,
      display_count: reactions.length > 13 ? '13+' : reactions.length 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
