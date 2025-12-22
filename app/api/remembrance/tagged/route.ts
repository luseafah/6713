import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch all users who tagged this user_id in their remembrance wikis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
        { status: 400 }
      );
    }

    // Find all remembrance_tags where this user was tagged
    const { data: tags, error: tagsError } = await supabaseAdmin
      .from('remembrance_tags')
      .select(`
        id,
        remembrance_id,
        tagged_username,
        remembrance_wikis!inner(
          id,
          creator_id,
          title,
          subject_name,
          is_public,
          profiles!remembrance_wikis_creator_id_fkey(
            id,
            username,
            nickname,
            verified_name,
            verified_at,
            profile_picture
          )
        )
      `)
      .eq('tagged_user_id', user_id)
      .eq('remembrance_wikis.is_public', true);

    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      throw tagsError;
    }

    if (!tags || tags.length === 0) {
      return NextResponse.json({ taggers: [] });
    }

    // Transform data to return creator info
    const taggers = tags.map((tag: any) => ({
      remembrance_id: tag.remembrance_id,
      remembrance_title: tag.remembrance_wikis.title,
      subject_name: tag.remembrance_wikis.subject_name,
      creator: {
        id: tag.remembrance_wikis.profiles.id,
        username: tag.remembrance_wikis.profiles.username,
        nickname: tag.remembrance_wikis.profiles.nickname,
        verified_name: tag.remembrance_wikis.profiles.verified_name,
        verified_at: tag.remembrance_wikis.profiles.verified_at,
        profile_picture: tag.remembrance_wikis.profiles.profile_picture,
      },
    }));

    return NextResponse.json({ taggers });
  } catch (error: any) {
    console.error('Error in tagged route:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
