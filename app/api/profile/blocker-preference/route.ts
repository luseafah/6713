import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PUT: Update user's blocker preference
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, blocker_preference } = body;

    if (!user_id || !blocker_preference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['black', 'white'].includes(blocker_preference)) {
      return NextResponse.json(
        { error: 'Invalid blocker preference. Must be "black" or "white".' },
        { status: 400 }
      );
    }

    // Update blocker preference
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ blocker_preference })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      blocker_preference,
    });
  } catch (error: any) {
    console.error('Error updating blocker preference:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
