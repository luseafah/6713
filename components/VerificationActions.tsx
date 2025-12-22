'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, Crown } from 'lucide-react';

interface VerificationActionsProps {
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

/**
 * Admin Actions in Pope AI Chat
 * Floating action buttons with smooth animations
 */
export default function VerificationActions({ 
  onApprove, 
  onReject, 
  loading = false 
}: VerificationActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-white/10 bg-gradient-to-r from-green-500/5 via-purple-500/5 to-red-500/5 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="text-white/80 text-sm font-medium">Admin Verification</span>
        </div>
        <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onApprove}
          disabled={loading}
          className="relative px-6 py-4 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500/50 hover:border-green-500 rounded-xl text-green-500 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <CheckCircle2 className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Verify</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReject}
          disabled={loading}
          className="relative px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 rounded-xl text-red-500 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <XCircle className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Reject</span>
        </motion.button>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-white/60 text-sm flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
          Processing...
        </motion.div>
      )}
    </motion.div>
  );
}
