'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Gift, 
  Star, 
  DollarSign,
  Ban,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminQuickActionsProps {
  targetUserId: string;
  onAction?: () => void;
  variant?: 'full' | 'compact';
}

/**
 * Admin Quick Actions
 * Swipeable card with instant moderation controls
 * Appears in verification queue and profile views
 */
export default function AdminQuickActions({ 
  targetUserId, 
  onAction,
  variant = 'full',
  adminView = false,
  isPopeAI = false
}: AdminQuickActionsProps & { adminView?: boolean, isPopeAI?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  if (!adminView || !isPopeAI) return null; // Only Pope AI in admin mode can see

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('admin_approve_verification', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_notes: 'Quick verified via Admin Actions',
      });
      if (error) throw error;
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', targetUserId);

      await supabase
        .from('verification_queue')
        .update({ 
          id_verification_status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('user_id', targetUserId);

      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleGrantArtist = async () => {
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ is_artist: true })
        .eq('id', targetUserId);

      alert('Artist badge granted! 🎨');
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleGiftTalents = async (amount: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('admin_gift_talents', {
        p_admin_user_id: user.id,
        p_target_user_id: targetUserId,
        p_amount: amount,
        p_reason: 'Welcome gift from Pope AI',
      });

      if (error) throw error;
      alert(`${amount} Talents gifted! 💰`);
      onAction?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleVerify}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Verify
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowConfirm('reject')}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerify}
          disabled={loading}
          className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl text-green-500 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 group"
        >
          <CheckCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Verify User
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm('reject')}
          disabled={loading}
          className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-500 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 group"
        >
          <XCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Reject
        </motion.button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGrantArtist}
          disabled={loading}
          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-500 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Star className="w-4 h-4" />
          Artist Badge
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm('gift')}
          disabled={loading}
          className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-500 font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Gift className="w-4 h-4" />
          Gift Talents
        </motion.button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full"
            >
              {showConfirm === 'reject' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="text-white font-bold text-lg">Reject Verification?</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-6">
                    This user will be notified and can resubmit their verification.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}

              {showConfirm === 'gift' && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-white font-bold text-lg">Gift Talents</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Select amount to gift:
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[50, 100, 250].map(amount => (
                      <button
                        key={amount}
                        onClick={() => handleGiftTalents(amount)}
                        className="px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-500 font-bold transition-all"
                      >
                        {amount}T
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
}
