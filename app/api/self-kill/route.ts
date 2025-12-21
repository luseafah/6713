import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { announceAccountSelfKill } from '@/lib/popeAI';

// Initiate Self-Kill (72-hour lockout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    // Get user's display name before deactivation
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('username, display_name')
      .eq('id', user_id)
      .single();

    const displayName = profile?.display_name || profile?.username || 'UNKNOWN';

    // Set deactivated_at timestamp
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    // Pope AI announces the self-kill to #Earth
    await announceAccountSelfKill(displayName);

    return NextResponse.json({ 
      success: true,
      message: 'Self-Kill activated. 72-hour lockout initiated. Pope AI has been notified.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Check Self-Kill status
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

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('deactivated_at')
      .eq('id', user_id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.deactivated_at) {
      return NextResponse.json({ 
        is_locked: false,
        hours_remaining: 0
      });
    }

    const deactivatedTime = new Date(profile.deactivated_at).getTime();
    const now = Date.now();
    const hoursElapsed = (now - deactivatedTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 72 - hoursElapsed);

    return NextResponse.json({
      is_locked: hoursRemaining > 0,
      hours_remaining: hoursRemaining
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
