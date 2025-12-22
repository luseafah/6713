import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Create a new remembrance wiki
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creator_id,
      subject_name,
      subject_user_id,
      relationship,
      title,
      content,
      tags, // Array of { user_id, username }
    } = body;

    if (!creator_id || !subject_name || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has permission
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('can_create_remembrance_wiki, can_create_unlimited_remembrance_wikis, verified_at')
      .eq('id', creator_id)
      .single();

    if (!profile?.verified_at) {
      return NextResponse.json(
        { error: 'Only verified users can create remembrance wikis' },
        { status: 403 }
      );
    }

    if (!profile?.can_create_remembrance_wiki) {
      return NextResponse.json(
        { error: 'You do not have permission to create remembrance wikis. Contact an admin.' },
        { status: 403 }
      );
    }

    // Check wiki limit: max 3 unless unlimited toggle is enabled
    if (!profile?.can_create_unlimited_remembrance_wikis) {
      const { count } = await supabaseAdmin
        .from('remembrance_wikis')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creator_id);

      if (count !== null && count >= 3) {
        return NextResponse.json(
          { error: 'You have reached the maximum of 3 graphy wikis. Contact an admin for unlimited access.' },
          { status: 403 }
        );
      }
    }

    // Create remembrance wiki
    const { data: wiki, error: wikiError } = await supabaseAdmin
      .from('remembrance_wikis')
      .insert({
        creator_id,
        subject_name,
        subject_user_id: subject_user_id || null,
        relationship: relationship || null,
        title,
        content,
        is_featured: true,
        is_public: true,
      })
      .select()
      .single();

    if (wikiError) throw wikiError;

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagInserts = tags.map((tag: any) => ({
        remembrance_id: wiki.id,
        tagged_user_id: tag.user_id,
        tagged_username: tag.username,
      }));

      const { error: tagError } = await supabaseAdmin
        .from('remembrance_tags')
        .insert(tagInserts);

      if (tagError) {
        console.error('Error adding tags:', tagError);
        // Don't fail the whole operation if tags fail
      }
    }

    return NextResponse.json({
      success: true,
      wiki,
    });
  } catch (error: any) {
    console.error('Error creating remembrance wiki:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update remembrance wiki
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wiki_id,
      creator_id,
      title,
      content,
      is_featured,
      is_public,
    } = body;

    if (!wiki_id || !creator_id) {
      return NextResponse.json(
        { error: 'wiki_id and creator_id required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('remembrance_wikis')
      .select('creator_id')
      .eq('id', wiki_id)
      .single();

    if (!existing || existing.creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update wiki
    const { error } = await supabaseAdmin
      .from('remembrance_wikis')
      .update({
        title,
        content,
        is_featured,
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wiki_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error updating remembrance wiki:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete remembrance wiki
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wiki_id = searchParams.get('wiki_id');
    const creator_id = searchParams.get('creator_id');

    if (!wiki_id || !creator_id) {
      return NextResponse.json(
        { error: 'wiki_id and creator_id required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('remembrance_wikis')
      .select('creator_id')
      .eq('id', wiki_id)
      .single();

    if (!existing || existing.creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete wiki (tags will cascade delete)
    const { error } = await supabaseAdmin
      .from('remembrance_wikis')
      .delete()
      .eq('id', wiki_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting remembrance wiki:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
