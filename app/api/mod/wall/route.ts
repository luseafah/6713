import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper: Verify mod status
async function verifyMod(modId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_moderator, is_admin')
    .eq('id', modId)
    .single();

  return profile?.is_moderator || profile?.is_admin;
}

// PUT: Edit wall message text
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mod_id, message_id, new_text } = body;

    if (!mod_id || !message_id || !new_text) {
      return NextResponse.json(
        { error: 'mod_id, message_id, and new_text are required' },
        { status: 400 }
      );
    }

    // Verify moderator status
    const isMod = await verifyMod(mod_id);
    if (!isMod) {
      return NextResponse.json(
        { error: 'Unauthorized: Moderator access required' },
        { status: 403 }
      );
    }

    // Update message
    const { error: updateError } = await supabaseAdmin
      .from('wall_messages')
      .update({ 
        message: new_text,
        updated_at: new Date().toISOString()
      })
      .eq('id', message_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Wall message updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating wall message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove wall message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mod_id = searchParams.get('mod_id');
    const message_id = searchParams.get('message_id');

    if (!mod_id || !message_id) {
      return NextResponse.json(
        { error: 'mod_id and message_id are required' },
        { status: 400 }
      );
    }

    // Verify moderator status
    const isMod = await verifyMod(mod_id);
    if (!isMod) {
      return NextResponse.json(
        { error: 'Unauthorized: Moderator access required' },
        { status: 403 }
      );
    }

    // Delete message
    const { error: deleteError } = await supabaseAdmin
      .from('wall_messages')
      .delete()
      .eq('id', message_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Wall message deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting wall message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
