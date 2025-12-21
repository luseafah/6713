import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { gig_id, worker_user_id } = await request.json();
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

    // Verify gig belongs to user
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select('*')
      .eq('id', gig_id)
      .eq('user_id', user.id)
      .single();

    if (gigError || !gig) {
      return NextResponse.json({ error: 'Gig not found or unauthorized' }, { status: 404 });
    }

    if (gig.is_completed) {
      return NextResponse.json({ error: 'Gig already completed' }, { status: 400 });
    }

    // Mark as completed
    const { error: updateError } = await supabaseAdmin
      .from('gigs')
      .update({ 
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', gig_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If worker_user_id is provided, record the connection
    if (worker_user_id && worker_user_id !== user.id) {
      const { error: connectionError } = await supabaseAdmin
        .from('gig_connections')
        .insert({
          gig_id: gig_id,
          poster_user_id: user.id,
          worker_user_id: worker_user_id,
          gig_title: gig.title,
          talent_amount: gig.talent_reward
        });

      if (connectionError) {
        console.error('Failed to record connection:', connectionError);
        // Don't fail the completion if connection recording fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
