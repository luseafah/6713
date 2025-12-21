import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Mark shrine link as viewed (view once)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ghost_user_id, rescuer_user_id, batch_number } = body;

    // Update cpr_log to mark as viewed
    const { error } = await supabaseAdmin
      .from('cpr_log')
      .update({
        shrine_link_viewed: true,
        shrine_link_viewed_at: new Date().toISOString(),
      })
      .eq('ghost_user_id', ghost_user_id)
      .eq('rescuer_user_id', rescuer_user_id)
      .eq('batch_number', batch_number);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
