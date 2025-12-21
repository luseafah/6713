import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Award max stats to a post (Admin only - rigged display)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_id, post_id } = body;

    // Verify admin permissions
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', admin_id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Set admin_rigged_stats flag (forces 13+ display)
    const { error: updateError } = await supabaseAdmin
      .from('wall_messages')
      .update({ admin_rigged_stats: true })
      .eq('id', post_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
