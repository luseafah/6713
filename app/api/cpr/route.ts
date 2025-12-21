import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Give CPR to a ghost user (costs 1 Talent) - 13th Revelation Logic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ghost_user_id, rescuer_user_id } = body;

    // Check rescuer has enough Talents
    const { data: rescuerProfile, error: rescuerError } = await supabaseAdmin
      .from('profiles')
      .select('talent_balance')
      .eq('id', rescuer_user_id)
      .single();

    if (rescuerError || !rescuerProfile) {
      return NextResponse.json(
        { error: 'Rescuer profile not found' },
        { status: 404 }
      );
    }

    if (rescuerProfile.talent_balance < 1) {
      return NextResponse.json(
        { error: 'Insufficient Talents. 1 CPR = 1 Talent' },
        { status: 403 }
      );
    }

    // Get current batch number (total CPRs / 13)
    const { data: allCPRs } = await supabaseAdmin
      .from('cpr_log')
      .select('id', { count: 'exact' })
      .eq('ghost_user_id', ghost_user_id);

    const totalCPRs = allCPRs?.length || 0;
    const currentBatch = Math.floor(totalCPRs / 13);

    // Check if already gave CPR in this batch
    const { data: existing } = await supabaseAdmin
      .from('cpr_log')
      .select('id')
      .eq('ghost_user_id', ghost_user_id)
      .eq('rescuer_user_id', rescuer_user_id)
      .eq('batch_number', currentBatch)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You already gave CPR in this batch' },
        { status: 400 }
      );
    }

    // Insert CPR log record
    const { error: cprError } = await supabaseAdmin
      .from('cpr_log')
      .insert({
        ghost_user_id,
        rescuer_user_id,
        batch_number: currentBatch,
      });

    if (cprError) throw cprError;

    // Keep legacy cpr_rescues for compatibility
    await supabaseAdmin
      .from('cpr_rescues')
      .insert({
        ghost_user_id,
        rescuer_user_id,
      });

    // Deduct 1 Talent
    await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: rescuerProfile.talent_balance - 1 })
      .eq('id', rescuer_user_id);

    const newCount = totalCPRs + 1;
    const batchProgress = newCount % 13;
    const displayCount = batchProgress === 0 ? 13 : batchProgress;

    // Get usernames
    const { data: ghostUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', ghost_user_id)
      .single();

    const { data: rescuerUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('id', rescuer_user_id)
      .single();

    // If 13th CPR, announce completion and reset counter
    if (displayCount === 13) {
      if (ghostUser && rescuerUser) {
        await supabaseAdmin
          .from('wall_messages')
          .insert({
            user_id: 'pope-ai',
            username: 'Pope AI',
            content: `🎊 @${rescuerUser.username} gave the 13th CPR to @${ghostUser.username}! The Secret Link is revealed to the 13 rescuers. Counter resets to 0/13.`,
            message_type: 'system',
            is_pope_ai: true,
          });
      }
    } else {
      // Regular CPR announcement
      if (ghostUser && rescuerUser) {
        await supabaseAdmin
          .from('wall_messages')
          .insert({
            user_id: 'pope-ai',
            username: 'Pope AI',
            content: `@everyone ${rescuerUser.username} gave CPR to @${ghostUser.username}. ${displayCount}/13 collected. 1 CPR = 1 Token.`,
            message_type: 'system',
            is_pope_ai: true,
          });
      }
    }

    return NextResponse.json({ 
      success: true,
      cpr_count: displayCount,
      batch_number: displayCount === 13 ? currentBatch + 1 : currentBatch,
      remaining_talents: rescuerProfile.talent_balance - 1,
      revelation_complete: displayCount === 13
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get CPR count and shrine link access for a ghost user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ghost_user_id = searchParams.get('ghost_user_id');
    const rescuer_user_id = searchParams.get('rescuer_user_id');

    if (!ghost_user_id) {
      return NextResponse.json(
        { error: 'ghost_user_id required' },
        { status: 400 }
      );
    }

    // Get all CPR logs for this ghost
    const { data: cprLogs, error } = await supabaseAdmin
      .from('cpr_log')
      .select('*')
      .eq('ghost_user_id', ghost_user_id);

    if (error) throw error;

    const totalCPRs = cprLogs?.length || 0;
    const currentBatch = Math.floor(totalCPRs / 13);
    const batchProgress = totalCPRs % 13;
    const displayCount = batchProgress === 0 && totalCPRs > 0 ? 13 : batchProgress;

    // If rescuer_user_id provided, check if they can access the shrine link
    let canAccessShrine = false;
    let shrineLink = null;

    if (rescuer_user_id) {
      // Find the latest completed batch where this user gave CPR
      const userCPRs = cprLogs?.filter((log: any) => log.rescuer_user_id === rescuer_user_id) || [];
      
      for (const cpr of userCPRs) {
        // Check if this batch is complete (has 13 CPRs)
        const batchCPRs = cprLogs?.filter((log: any) => log.batch_number === cpr.batch_number) || [];
        
        if (batchCPRs.length >= 13 && !cpr.shrine_link_viewed) {
          canAccessShrine = true;
          
          // Get shrine link
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('shrine_link')
            .eq('id', ghost_user_id)
            .single();
          
          shrineLink = profile?.shrine_link;
          break;
        }
      }
    }

    return NextResponse.json({
      count: displayCount,
      batch_number: currentBatch,
      total_cprs: totalCPRs,
      can_access_shrine: canAccessShrine,
      shrine_link: canAccessShrine ? shrineLink : null,
      rescuers: cprLogs
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
