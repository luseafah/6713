import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Toggle user verification status (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_id, target_user_id, is_verified } = body;

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

    // Update target user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_verified })
      .eq('id', target_user_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
