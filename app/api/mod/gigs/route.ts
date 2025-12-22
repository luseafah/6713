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

// PUT: Edit gig details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mod_id, gig_id, updates } = body;

    if (!mod_id || !gig_id || !updates) {
      return NextResponse.json(
        { error: 'mod_id, gig_id, and updates object are required' },
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

    // Update gig with allowed fields
    const allowedFields = ['title', 'description', 'budget', 'status', 'category'];
    const filteredUpdates: any = {};
    
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('gigs')
      .update(filteredUpdates)
      .eq('id', gig_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Gig updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating gig:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove gig
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mod_id = searchParams.get('mod_id');
    const gig_id = searchParams.get('gig_id');

    if (!mod_id || !gig_id) {
      return NextResponse.json(
        { error: 'mod_id and gig_id are required' },
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

    // Delete gig
    const { error: deleteError } = await supabaseAdmin
      .from('gigs')
      .delete()
      .eq('id', gig_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Gig deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting gig:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
