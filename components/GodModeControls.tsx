'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Ban, DollarSign, Trash2, Eye, EyeOff, Gift } from 'lucide-react';
import { hapticGigTap } from '@/lib/sensoryFeedback';

interface GodModeControlsProps {
  userId: string; // Target user
  messageId?: string; // If moderating a message
  onAction?: () => void; // Callback after action
}

/**
 * 6713 Protocol: Pope AI God Mode Controls
 * 
 * Admin overlay that appears when long-pressing user content
 * Provides Strike, Fine, Shadow Ban, Delete, and Gift controls
 */
export function GodModeControls({ userId, messageId, onAction }: GodModeControlsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState(50);

  const handleFine = async (amount: number) => {
    hapticGigTap();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_issue_fine', {
        p_admin_user_id: user.id,
        p_target_user_id: userId,
        p_amount: amount,
        p_reason: 'Protocol violation - frequency disruption',
        p_reference_id: messageId,
        p_reference_type: messageId ? 'message' : null,
      });

      if (error) throw error;

      alert(`Fine issued: ${amount} Talents deducted. New balance: ${data.new_balance}`);
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleStrike = async () => {
    hapticGigTap();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_issue_strike', {
        p_admin_user_id: user.id,
        p_target_user_id: userId,
        p_reason: 'Protocol violation',
        p_reference_id: messageId,
      });

      if (error) throw error;

      alert(`Strike issued. Total strikes: ${data.strike_count}. ${data.auto_ban ? 'USER AUTO-BANNED (3 strikes)' : ''}`);
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleShadowBan = async () => {
    hapticGigTap();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_shadow_ban', {
        p_admin_user_id: user.id,
        p_target_user_id: userId,
        p_reason: 'Frequency muted by Pope AI',
      });

      if (error) throw error;

      alert('User shadow banned. Their messages are now invisible to others.');
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleGift = async (amount: number) => {
    hapticGigTap();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_gift_talents', {
        p_admin_user_id: user.id,
        p_target_user_id: userId,
        p_amount: amount,
        p_reason: 'Gift from Pope AI',
      });

      if (error) throw error;

      alert(`Gift sent: ${amount} Talents credited. New balance: ${data.new_balance}`);
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!messageId) return;
    if (!confirm('Delete this message permanently?')) return;

    hapticGigTap();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('wall_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      alert('Message deleted');
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors"
        title="God Mode Controls"
      >
        <AlertTriangle size={16} className="text-red-500" />
      </button>

      {/* Popup Menu */}
      {showMenu && (
        <div className="absolute right-0 top-12 w-72 bg-zinc-900 border-2 border-red-500 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 p-3 flex items-center justify-between">
            <span className="text-black font-bold text-sm">POPE AI GOD MODE</span>
            <button onClick={() => setShowMenu(false)} className="text-black hover:text-white">
              ✕
            </button>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {/* Strike */}
            <button
              onClick={handleStrike}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <AlertTriangle size={18} className="text-orange-500" />
              <div>
                <div className="text-white font-medium text-sm">Issue Strike</div>
                <div className="text-white/60 text-xs">Warning - 3 strikes = ban</div>
              </div>
            </button>

            {/* Quick Fines */}
            <div className="grid grid-cols-3 gap-2">
              {[10, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleFine(amount)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <DollarSign size={16} className="text-red-500" />
                  <span className="text-white text-xs font-bold">-{amount}T</span>
                </button>
              ))}
            </div>

            {/* Custom Fine */}
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                placeholder="Amount"
              />
              <button
                onClick={() => handleFine(customAmount)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                Fine
              </button>
            </div>

            {/* Shadow Ban */}
            <button
              onClick={handleShadowBan}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <EyeOff size={18} className="text-purple-500" />
              <div>
                <div className="text-white font-medium text-sm">Shadow Ban</div>
                <div className="text-white/60 text-xs">Mute frequency (invisible posts)</div>
              </div>
            </button>

            {/* Gift Talents */}
            <button
              onClick={() => handleGift(100)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <Gift size={18} className="text-green-500" />
              <div>
                <div className="text-white font-medium text-sm">Gift 100 Talents</div>
                <div className="text-white/60 text-xs">Reward user</div>
              </div>
            </button>

            {/* Delete Message */}
            {messageId && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <Trash2 size={18} className="text-red-500" />
                <div>
                  <div className="text-white font-medium text-sm">Delete Message</div>
                  <div className="text-white/60 text-xs">Permanent removal</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setIsAdmin(data?.role === 'admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
}
