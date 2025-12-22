import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Admin toggles unlimited remembrance wiki creation for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_id, target_user_id, enable_unlimited } = body;

    if (!admin_id || !target_user_id || enable_unlimited === undefined) {
      return NextResponse.json(
        { error: 'admin_id, target_user_id, and enable_unlimited (boolean) are required' },
        { status: 400 }
      );
    }

    // Verify admin status
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', admin_id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Update target user's unlimited flag
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ can_create_unlimited_remembrance_wikis: enable_unlimited })
      .eq('id', target_user_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: enable_unlimited
        ? 'User can now create unlimited graphy wikis'
        : 'User limited to 3 graphy wikis',
    });
  } catch (error: any) {
    console.error('Error toggling unlimited remembrance:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
