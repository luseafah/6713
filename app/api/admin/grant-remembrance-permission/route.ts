import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Admin grants permission to create remembrance wikis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_id, user_id, grant } = body; // grant = true/false

    if (!admin_id || !user_id || grant === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', admin_id)
      .single();

    if (!admin?.is_admin && admin?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can grant this permission' },
        { status: 403 }
      );
    }

    // Grant or revoke permission
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ can_create_remembrance_wiki: grant })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: grant
        ? 'Permission granted to create remembrance wikis'
        : 'Permission revoked',
    });
  } catch (error: any) {
    console.error('Error managing remembrance wiki permission:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
