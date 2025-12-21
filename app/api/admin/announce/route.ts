import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/admin/announce - Create official announcement (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      admin_user_id,
      content,
      media_url,
      donation_goal,
      mentioned_username 
    } = body;

    // Verify admin status
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', admin_user_id)
      .single();

    if (!admin?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Find mentioned user if specified
    let mentioned_user_id = null;
    if (mentioned_username) {
      const { data: mentionedUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', mentioned_username.replace('@', ''))
        .single();
      
      mentioned_user_id = mentionedUser?.id || null;
    }

    // Create announcement
    const { data: announcement, error } = await supabaseAdmin
      .from('official_announcements')
      .insert({
        content,
        media_url,
        donation_goal,
        mentioned_user_id,
        mentioned_username: mentioned_username?.replace('@', '')
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      announcement
    });

  } catch (error: any) {
    console.error('Announcement creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/announce - Get all active announcements
 */
export async function GET() {
  try {
    const { data: announcements, error } = await supabaseAdmin
      .from('official_announcements')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ announcements });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
