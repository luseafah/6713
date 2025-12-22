import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Check if viewer has revealed viewed user's profile picture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewer_id = searchParams.get('viewer_id');
    const viewed_user_id = searchParams.get('viewed_user_id');

    if (!viewer_id || !viewed_user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if reveal exists
    const { data: reveal, error } = await supabaseAdmin
      .from('profile_picture_reveals')
      .select('picture_url_at_reveal, revealed_at')
      .eq('viewer_id', viewer_id)
      .eq('viewed_user_id', viewed_user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error, just not revealed yet)
      throw error;
    }

    return NextResponse.json({
      revealed: !!reveal,
      picture_url_at_reveal: reveal?.picture_url_at_reveal || null,
      revealed_at: reveal?.revealed_at || null,
    });
  } catch (error: any) {
    console.error('Error checking reveal status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Purchase reveal for 1 Talent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { viewer_id, viewed_user_id, picture_url } = body;

    if (!viewer_id || !viewed_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Cannot reveal own picture (should already be visible)
    if (viewer_id === viewed_user_id) {
      return NextResponse.json(
        { error: 'Cannot reveal your own picture' },
        { status: 400 }
      );
    }

    // Check if already revealed
    const { data: existingReveal } = await supabaseAdmin
      .from('profile_picture_reveals')
      .select('id, picture_url_at_reveal')
      .eq('viewer_id', viewer_id)
      .eq('viewed_user_id', viewed_user_id)
      .single();

    if (existingReveal) {
      // Check if picture has changed
      if (existingReveal.picture_url_at_reveal === picture_url) {
        return NextResponse.json({
          success: true,
          message: 'Already revealed',
        });
      } else {
        // Picture changed, need to pay again
        // Update the reveal record with new picture URL
        const { error: updateError } = await supabaseAdmin
          .from('profile_picture_reveals')
          .update({
            picture_url_at_reveal: picture_url,
            revealed_at: new Date().toISOString(),
          })
          .eq('id', existingReveal.id);

        if (updateError) throw updateError;
      }
    }

    // Check viewer's talent balance
    const { data: viewerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('talent_balance')
      .eq('id', viewer_id)
      .single();

    if (profileError) throw profileError;

    if ((viewerProfile?.talent_balance || 0) < 1) {
      return NextResponse.json(
        { error: 'Insufficient Talents. You need 1 Talent to reveal.' },
        { status: 400 }
      );
    }

    // Deduct 1 Talent from viewer
    const { error: deductError } = await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: viewerProfile.talent_balance - 1 })
      .eq('id', viewer_id);

    if (deductError) throw deductError;

    // Create or update reveal record
    if (!existingReveal) {
      const { error: insertError } = await supabaseAdmin
        .from('profile_picture_reveals')
        .insert({
          viewer_id,
          viewed_user_id,
          picture_url_at_reveal: picture_url,
        });

      if (insertError) throw insertError;
    }

    // Log transaction
    await supabaseAdmin.from('talent_transactions').insert({
      user_id: viewer_id,
      amount: -1,
      transaction_type: 'profile_picture_reveal',
      description: `Revealed profile picture for user ${viewed_user_id}`,
    });

    return NextResponse.json({
      success: true,
      new_balance: viewerProfile.talent_balance - 1,
    });
  } catch (error: any) {
    console.error('Error purchasing reveal:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
