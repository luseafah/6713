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

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Auto-regenerate refills
    let refills = profile.coma_refills;
    const lastUpdated = new Date(profile.coma_refills_last_updated).getTime();
    const hoursPassed = (Date.now() - lastUpdated) / (1000 * 60 * 60);
    
    if (hoursPassed >= 24 && refills < 3) {
      const refillsToAdd = Math.floor(hoursPassed / 24);
      refills = Math.min(3, refills + refillsToAdd);
      
      // Update the database
      await supabaseAdmin
        .from('profiles')
        .update({
          coma_refills: refills,
          coma_refills_last_updated: new Date().toISOString(),
        })
        .eq('id', user_id);
    }

    // Calculate cooldown
    let cooldownHours = 0;
    if (profile.coma_exited_at) {
      const exitTime = new Date(profile.coma_exited_at).getTime();
      const hoursSinceExit = (Date.now() - exitTime) / (1000 * 60 * 60);
      if (hoursSinceExit < 24) {
        cooldownHours = 24 - hoursSinceExit;
      }
    }

    return NextResponse.json({
      coma_status: profile.coma_status,
      coma_reason: profile.coma_reason,
      coma_refills: refills,
      talent_balance: profile.talent_balance,
      cooldown_hours: cooldownHours,
      can_enter_coma: cooldownHours === 0 && !profile.coma_status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
