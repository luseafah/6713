import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Get or create Pope AI thread for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    // Check if Pope AI thread exists
    let { data: thread, error } = await supabaseAdmin
      .from('dm_threads')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_pope_ai', true)
      .single();

    // Create if doesn't exist
    if (!thread) {
      const { data: newThread, error: createError } = await supabaseAdmin
        .from('dm_threads')
        .insert({
          user_id,
          is_pope_ai: true,
        })
        .select()
        .single();

      if (createError) throw createError;
      thread = newThread;
    }

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('dm_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return NextResponse.json({
      thread,
      messages: messages || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Send message to Pope AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, content } = body;

    // Get or create thread
    let { data: thread } = await supabaseAdmin
      .from('dm_threads')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_pope_ai', true)
      .single();

    if (!thread) {
      const { data: newThread, error: createError } = await supabaseAdmin
        .from('dm_threads')
        .insert({
          user_id,
          is_pope_ai: true,
        })
        .select()
        .single();

      if (createError) throw createError;
      thread = newThread;
    }

    // Get user info
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', user_id)
      .single();

    // Check if user is in COMA (whisper mode)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('coma_status')
      .eq('id', user_id)
      .single();

    // Insert message
    const { data: message, error: msgError } = await supabaseAdmin
      .from('dm_messages')
      .insert({
        thread_id: thread.id,
        sender_id: user_id,
        sender_username: user?.username || 'User',
        content,
        is_whisper: profile?.coma_status || false,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
