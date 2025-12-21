import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Edit shrine (limited by cooldown and cost)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, shrine_link, shrine_media } = body;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('last_shrine_edit, talent_balance')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    let cost = 0;

    // Check if within 24h free edit window
    if (profile.last_shrine_edit) {
      const lastEdit = new Date(profile.last_shrine_edit).getTime();
      const hoursSinceEdit = (Date.now() - lastEdit) / (1000 * 60 * 60);

      if (hoursSinceEdit < 24) {
        // Extra edit costs 10 Talents
        cost = 10;
        if (profile.talent_balance < cost) {
          return NextResponse.json(
            { error: 'Insufficient Talents. Cost: 10 Talents' },
            { status: 403 }
          );
        }
      }
    }

    // Update shrine
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        shrine_link,
        shrine_media,
        last_shrine_edit: new Date().toISOString(),
        talent_balance: profile.talent_balance - cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      cost,
      remaining_balance: profile.talent_balance - cost
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get edit cost (free once per 24 hours, then 10 Talents)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('last_shrine_edit')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Check if last edit was within 24 hours
    if (profile?.last_shrine_edit) {
      const lastEdit = new Date(profile.last_shrine_edit);
      const hoursSinceEdit = (Date.now() - lastEdit.getTime()) / (1000 * 60 * 60);

      if (hoursSinceEdit < 24) {
        return NextResponse.json({ cost: 10 });
      }
    }

    return NextResponse.json({ cost: 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
