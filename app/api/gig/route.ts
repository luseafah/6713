import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { title, description, talent_reward, budge_enabled } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has less than 5 active gigs
    const { data: activeGigs, error: countError } = await supabaseAdmin
      .from('gigs')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', false);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (activeGigs && activeGigs.length >= 5) {
      return NextResponse.json({ 
        error: 'You have reached the maximum of 5 active Gigs. Complete one to post another.' 
      }, { status: 400 });
    }

    // Check user has at least 10 Talents
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('talent_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.talent_balance < 10) {
      return NextResponse.json({ 
        error: 'Insufficient Talents. You need 10 Talents to post a Gig.' 
      }, { status: 400 });
    }

    // Deduct 10 Talents
    const { error: deductError } = await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: profile.talent_balance - 10 })
      .eq('id', user.id);

    if (deductError) {
      return NextResponse.json({ error: deductError.message }, { status: 500 });
    }

    // Create Gig
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .insert({
        user_id: user.id,
        title,
        description,
        talent_reward,
        budge_enabled: budge_enabled || false
      })
      .select()
      .single();

    if (gigError) {
      // Rollback: Refund 10 Talents
      await supabaseAdmin
        .from('profiles')
        .update({ talent_balance: profile.talent_balance })
        .eq('id', user.id);
      
      return NextResponse.json({ error: gigError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      gig,
      new_balance: profile.talent_balance - 10 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Get user's gigs
    const { data: gigs, error } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activeCount = gigs?.filter(g => !g.is_completed).length || 0;

    return NextResponse.json({ 
      gigs: gigs || [],
      active_count: activeCount,
      can_post_more: activeCount < 5
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
