import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    const { data: cooldown } = await supabaseAdmin
      .from('post_cooldowns')
      .select('last_post_at')
      .eq('user_id', user_id)
      .single();

    if (!cooldown) {
      return NextResponse.json({ canPost: true, remainingTime: 0 });
    }

    const lastPostTime = new Date(cooldown.last_post_at).getTime();
    const now = Date.now();
    const timeSinceLastPost = (now - lastPostTime) / 1000;

    if (timeSinceLastPost < 7) {
      const remainingTime = Math.ceil(7 - timeSinceLastPost);
      return NextResponse.json({ 
        canPost: false, 
        remainingTime 
      });
    }

    return NextResponse.json({ canPost: true, remainingTime: 0 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
