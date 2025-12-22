import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    let query = supabaseAdmin
      .from('wall_messages')
      .select(`
        *,
        reaction_count:wall_reactions(count),
        profiles!wall_messages_user_id_fkey(nickname, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, content, message_type = 'text' } = body;

    // Verify user exists and is verified
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('username, is_verified')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.is_verified) {
      return NextResponse.json(
        { error: 'Only verified users can post' },
        { status: 403 }
      );
    }

    // Check 7-second cooldown
    const { data: cooldown } = await supabaseAdmin
      .from('post_cooldowns')
      .select('last_post_at')
      .eq('user_id', user_id)
      .single();

    if (cooldown) {
      const lastPostTime = new Date(cooldown.last_post_at).getTime();
      const now = Date.now();
      const timeSinceLastPost = (now - lastPostTime) / 1000;

      if (timeSinceLastPost < 7) {
        const remainingTime = Math.ceil(7 - timeSinceLastPost);
        return NextResponse.json(
          { 
            error: 'Please wait before posting again',
            cooldown: remainingTime 
          },
          { status: 429 }
        );
      }
    }

    // Get user's COMA status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('coma_status, coma_reason')
      .eq('id', user_id)
      .single();

    const isComaWhisper = profile?.coma_status || false;

    // Create the message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('wall_messages')
      .insert({
        user_id,
        username: user.username,
        content,
        message_type,
        is_coma_whisper: isComaWhisper,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update cooldown
    await supabaseAdmin
      .from('post_cooldowns')
      .upsert({
        user_id,
        last_post_at: new Date().toISOString(),
      });

    // If user is in COMA, post Pope AI warning
    if (isComaWhisper) {
      await supabaseAdmin
        .from('wall_messages')
        .insert({
          user_id: 'pope-ai',
          username: 'Pope AI',
          content: `@everyone advice @${user.username} in coma status to log off`,
          message_type: 'system',
          is_pope_ai: true,
        });
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
