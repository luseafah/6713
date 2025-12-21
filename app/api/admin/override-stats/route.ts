import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Admin: Override post like-count to "13+"
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

    // Check if override already exists
    const { data: existing } = await supabaseAdmin
      .from('admin_post_overrides')
      .select('id')
      .eq('post_id', post_id)
      .single();

    if (existing) {
      // Remove override
      await supabaseAdmin
        .from('admin_post_overrides')
        .delete()
        .eq('post_id', post_id);

      return NextResponse.json({ success: true, overridden: false });
    }

    // Create override
    const { error: insertError } = await supabaseAdmin
      .from('admin_post_overrides')
      .insert({
        post_id,
        override_like_count: '13+',
        overridden_by: admin_id,
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, overridden: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get override status for posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (postId) {
      // Get single post override
      const { data } = await supabaseAdmin
        .from('admin_post_overrides')
        .select('*')
        .eq('post_id', postId)
        .single();

      return NextResponse.json({ override: data });
    }

    // Get all overrides
    const { data, error } = await supabaseAdmin
      .from('admin_post_overrides')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ overrides: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
