import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ThrowTalentResult {
  success: boolean;
  error?: string;
  newSenderBalance?: number;
  newReceiverBalance?: number;
}

export function useThrowTalent() {
  const [throwing, setThrowing] = useState(false);

  /**
   * Throw Talents from one user to another
   * Handles the transaction atomically at the database level
   * 
   * @param senderId - User throwing Talents
   * @param receiverId - User receiving Talents
   * @param amount - Amount to throw (1, 5, or 10)
   * @returns Result with new balances or error
   */
  const throwTalents = async (
    senderId: string,
    receiverId: string,
    amount: number
  ): Promise<ThrowTalentResult> => {
    // Validate amount (only 1, 5, or 10 Talents)
    if (![1, 5, 10].includes(amount)) {
      return {
        success: false,
        error: 'Invalid amount. Can only throw 1, 5, or 10 Talents.',
      };
    }

    // Prevent self-throwing
    if (senderId === receiverId) {
      return {
        success: false,
        error: 'Cannot throw Talents to yourself.',
      };
    }

    setThrowing(true);

    try {
      // Call database function for atomic transaction
      const { data, error } = await supabase.rpc('throw_talents', {
        sender_id: senderId,
        receiver_id: receiverId,
        talent_amount: amount,
      });

      if (error) {
        console.error('Talent throw error:', error);
        return {
          success: false,
          error: error.message || 'Failed to throw Talents',
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Insufficient balance or invalid operation',
        };
      }

      return {
        success: true,
        newSenderBalance: data.new_sender_balance,
        newReceiverBalance: data.new_receiver_balance,
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    } finally {
      setThrowing(false);
    }
  };

  return {
    throwTalents,
    throwing,
  };
}
