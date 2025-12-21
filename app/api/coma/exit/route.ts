import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('coma_status')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile.coma_status) {
      return NextResponse.json(
        { error: 'Not in COMA status' },
        { status: 400 }
      );
    }

    // Update profile to exit COMA and start 24h cooldown
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        coma_status: false,
        coma_exited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
