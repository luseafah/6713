import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Request to break the 4th wall (costs 100 Talents)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coma_user_id, requester_user_id, message_content, action, break_id } = body;

    // If action is provided, handle Accept/Reject
    if (action && break_id) {
      if (action === 'accept') {
        // Give 100 Talents to COMA user
        const { data: comaProfile } = await supabaseAdmin
          .from('profiles')
          .select('talent_balance')
          .eq('id', coma_user_id)
          .single();

        if (comaProfile) {
          await supabaseAdmin
            .from('profiles')
            .update({ talent_balance: comaProfile.talent_balance + 100 })
            .eq('id', coma_user_id);
        }

        // Mark as accepted
        await supabaseAdmin
          .from('fourth_wall_breaks')
          .update({ 
            status: 'accepted',
            responded_at: new Date().toISOString()
          })
          .eq('id', break_id);

        return NextResponse.json({ 
          success: true,
          action: 'accepted',
          talents_received: 100
        });

      } else if (action === 'reject') {
        // Talents already deducted, they go to the Company (do nothing)
        
        // Mark as rejected
        await supabaseAdmin
          .from('fourth_wall_breaks')
          .update({ 
            status: 'rejected',
            responded_at: new Date().toISOString()
          })
          .eq('id', break_id);

        return NextResponse.json({ 
          success: true,
          action: 'rejected'
        });
      }
    }

    // Create new 4th wall break request
    // Check requester has enough Talents
    const { data: requesterProfile, error: requesterError } = await supabaseAdmin
      .from('profiles')
      .select('talent_balance')
      .eq('id', requester_user_id)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Requester profile not found' },
        { status: 404 }
      );
    }

    if (requesterProfile.talent_balance < 100) {
      return NextResponse.json(
        { error: 'Insufficient Talents. Need 100 Talents to Break 4th Wall.' },
        { status: 403 }
      );
    }

    // Deduct 100 Talents
    await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: requesterProfile.talent_balance - 100 })
      .eq('id', requester_user_id);

    // Create fourth wall break request
    const { data, error } = await supabaseAdmin
      .from('fourth_wall_breaks')
      .insert({
        coma_user_id,
        requester_user_id,
        message_content,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      break_id: data.id,
      remaining_talents: requesterProfile.talent_balance - 100
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get pending 4th wall break requests for a COMA user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coma_user_id = searchParams.get('coma_user_id');

    if (!coma_user_id) {
      return NextResponse.json(
        { error: 'coma_user_id required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('fourth_wall_breaks')
      .select('*')
      .eq('coma_user_id', coma_user_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get requester usernames
    const requestsWithUsernames = await Promise.all(
      (data || []).map(async (req: any) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('username')
          .eq('id', req.requester_user_id)
          .single();
        
        return {
          ...req,
          requester_username: user?.username || 'Unknown'
        };
      })
    );

    return NextResponse.json({ requests: requestsWithUsernames });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
