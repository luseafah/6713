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

// POST: Adjust user talent balance (add or subtract)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mod_id, target_user_id, amount, reason } = body;

    if (!mod_id || !target_user_id || amount === undefined) {
      return NextResponse.json(
        { error: 'mod_id, target_user_id, and amount are required' },
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

    // Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('talent_balance')
      .eq('id', target_user_id)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = profile?.talent_balance || 0;
    const newBalance = Math.max(0, currentBalance + amount); // Can't go below 0

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ talent_balance: newBalance })
      .eq('id', target_user_id);

    if (updateError) throw updateError;

    // Log the transaction
    const { error: logError } = await supabaseAdmin
      .from('talent_transactions')
      .insert({
        user_id: target_user_id,
        amount: amount,
        transaction_type: amount > 0 ? 'mod_add' : 'mod_subtract',
        description: reason || `Moderator adjustment by ${mod_id}`,
        new_balance: newBalance,
      });

    if (logError) {
      console.error('Failed to log talent transaction:', logError);
      // Don't fail the whole operation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Talent balance ${amount > 0 ? 'increased' : 'decreased'} by ${Math.abs(amount)}`,
      old_balance: currentBalance,
      new_balance: newBalance,
    });
  } catch (error: any) {
    console.error('Error adjusting talent balance:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
