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

// PUT: Edit remembrance wiki
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mod_id, wiki_id, updates } = body;

    if (!mod_id || !wiki_id || !updates) {
      return NextResponse.json(
        { error: 'mod_id, wiki_id, and updates object are required' },
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

    // Update wiki with allowed fields
    const allowedFields = ['title', 'content', 'subject_name', 'relationship', 'is_featured', 'is_public'];
    const filteredUpdates: any = {};
    
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('remembrance_wikis')
      .update(filteredUpdates)
      .eq('id', wiki_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Remembrance wiki updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating remembrance wiki:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove remembrance wiki
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mod_id = searchParams.get('mod_id');
    const wiki_id = searchParams.get('wiki_id');

    if (!mod_id || !wiki_id) {
      return NextResponse.json(
        { error: 'mod_id and wiki_id are required' },
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

    // Delete wiki (cascade will delete tags)
    const { error: deleteError } = await supabaseAdmin
      .from('remembrance_wikis')
      .delete()
      .eq('id', wiki_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Remembrance wiki deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting remembrance wiki:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
