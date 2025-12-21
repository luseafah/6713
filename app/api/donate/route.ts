import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/donate - Donate Talent to an official announcement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      announcement_id,
      donor_user_id,
      amount 
    } = body;

    if (!announcement_id || !donor_user_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid donation parameters' },
        { status: 400 }
      );
    }

    // Get donor info and check balance
    const { data: donor } = await supabaseAdmin
      .from('users')
      .select('username, talent_balance')
      .eq('id', donor_user_id)
      .single();

    if (!donor) {
      return NextResponse.json(
        { error: 'Donor not found' },
        { status: 404 }
      );
    }

    if (donor.talent_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient Talent balance' },
        { status: 400 }
      );
    }

    // Verify announcement exists and is active
    const { data: announcement } = await supabaseAdmin
      .from('official_announcements')
      .select('id, donation_goal, current_donations')
      .eq('id', announcement_id)
      .is('archived_at', null)
      .single();

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found or archived' },
        { status: 404 }
      );
    }

    // Deduct Talent from donor
    const { error: deductError } = await supabaseAdmin
      .from('users')
      .update({ talent_balance: donor.talent_balance - amount })
      .eq('id', donor_user_id);

    if (deductError) throw deductError;

    // Record donation (trigger will update announcement progress)
    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert({
        announcement_id,
        donor_user_id,
        donor_username: donor.username,
        amount
      })
      .select()
      .single();

    if (donationError) {
      // Rollback: refund Talent
      await supabaseAdmin
        .from('users')
        .update({ talent_balance: donor.talent_balance })
        .eq('id', donor_user_id);
      
      throw donationError;
    }

    return NextResponse.json({
      success: true,
      donation,
      new_balance: donor.talent_balance - amount
    });

  } catch (error: any) {
    console.error('Donation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/donate?announcement_id=xxx - Get donations for an announcement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const announcement_id = searchParams.get('announcement_id');

    if (!announcement_id) {
      return NextResponse.json(
        { error: 'announcement_id required' },
        { status: 400 }
      );
    }

    const { data: donations, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('announcement_id', announcement_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ donations });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
