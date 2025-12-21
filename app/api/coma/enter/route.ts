import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, reason } = body; // reason: 'Choice' or 'Quest'

    if (!reason || !['Choice', 'Quest'].includes(reason)) {
      return NextResponse.json(
        { error: 'Valid reason required (Choice or Quest)' },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is already in COMA
    if (profile.coma_status) {
      return NextResponse.json(
        { error: 'Already in COMA status' },
        { status: 400 }
      );
    }

    // Check 24-hour cooldown from last exit
    if (profile.coma_exited_at) {
      const exitTime = new Date(profile.coma_exited_at).getTime();
      const now = Date.now();
      const hoursSinceExit = (now - exitTime) / (1000 * 60 * 60);

      if (hoursSinceExit < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceExit);
        return NextResponse.json(
          { 
            error: 'Cannot enter COMA yet',
            cooldownHours: hoursRemaining 
          },
          { status: 429 }
        );
      }
    }

    // Auto-regenerate refills based on time passed
    let refills = profile.coma_refills;
    const lastUpdated = new Date(profile.coma_refills_last_updated).getTime();
    const hoursPassed = (Date.now() - lastUpdated) / (1000 * 60 * 60);
    
    if (hoursPassed >= 24 && refills < 3) {
      const refillsToAdd = Math.floor(hoursPassed / 24);
      refills = Math.min(3, refills + refillsToAdd);
    }

    // Check if user has refills or enough talents
    let talents = profile.talent_balance;
    
    if (refills > 0) {
      // Use a refill
      refills -= 1;
    } else if (talents >= 50) {
      // Pay with talents
      talents -= 50;
    } else {
      return NextResponse.json(
        { 
          error: 'Insufficient refills or talents',
          refills,
          talent_balance: talents 
        },
        { status: 403 }
      );
    }

    // Update profile to enter COMA
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        coma_status: true,
        coma_reason: reason,
        coma_entered_at: new Date().toISOString(),
        coma_refills: refills,
        coma_refills_last_updated: new Date().toISOString(),
        talent_balance: talents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      refills,
      talent_balance: talents 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
