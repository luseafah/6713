import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Toggle Glaze Protocol (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_id, enabled } = body;

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

    // Update glaze protocol setting
    const { error: updateError } = await supabaseAdmin
      .from('system_settings')
      .update({ setting_value: enabled })
      .eq('setting_key', 'glaze_active');

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, enabled });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get Glaze Protocol status
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'glaze_active')
      .single();

    if (error) throw error;

    return NextResponse.json({ enabled: data.setting_value });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
