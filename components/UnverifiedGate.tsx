'use client';

import { motion } from 'framer-motion';
import { Lock, Crown, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UnverifiedGateProps {
  feature: 'hue' | 'live' | 'menu' | 'post' | 'profile' | 'dm';
  variant?: 'overlay' | 'toast' | 'inline';
}

/**
 * Unverified User Gate
 * Shows when unverified users try to access restricted features
 * Directs them to Pope AI verification chat
 */
export default function UnverifiedGate({ feature, variant = 'overlay' }: UnverifiedGateProps) {
  const router = useRouter();

  const messages = {
    hue: {
      title: 'Hue is Locked',
      message: 'Complete verification with Pope AI to post and view Hue videos',
    },
    live: {
      title: 'Live is Locked',
      message: 'Verified users only. Complete verification to access Live streams',
    },
    menu: {
      title: 'Feature Locked',
      message: 'This section requires verification. Chat with Pope AI to get verified',
    },
    post: {
      title: 'Posting Locked',
      message: 'Complete verification to post on the Wall and interact with the community',
    },
    profile: {
      title: 'Profiles Locked',
      message: 'Complete verification to view user profiles and connect with others',
    },
    dm: {
      title: 'Messages Locked',
      message: 'Only Pope AI chat is available. Get verified to message other users',
    },
  };

  const { title, message } = messages[feature];

  const handleNavigateToVerification = () => {
    router.push('/messages');
  };

  if (variant === 'toast') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 backdrop-blur-xl border-2 border-yellow-500/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm">{title}</h4>
              <p className="text-white/70 text-xs">{message}</p>
            </div>
          </div>
          <button
            onClick={handleNavigateToVerification}
            className="w-full mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Talk to Pope AI
          </button>
        </div>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
        <Lock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white/80 text-sm">{message}</p>
        </div>
        <button
          onClick={handleNavigateToVerification}
          className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-500 font-bold text-xs transition-colors whitespace-nowrap"
        >
          Get Verified
        </button>
      </div>
    );
  }

  // Overlay variant (default)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6"
      onClick={handleNavigateToVerification}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/50 rounded-3xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-yellow-500" />
        </div>

        <h2 className="text-white font-bold text-2xl mb-3">{title}</h2>
        <p className="text-white/80 text-base leading-relaxed mb-6">{message}</p>

        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>Average verification time: 2-5 minutes</span>
          </div>
          <p className="text-white/40 text-xs">
            Chat with Pope AI to complete your verification and unlock all features
          </p>
        </div>

        <button
          onClick={handleNavigateToVerification}
          className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-black font-bold text-lg transition-all flex items-center justify-center gap-2 group"
        >
          <Crown className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Talk to Pope AI
        </button>

        <button
          onClick={handleNavigateToVerification}
          className="mt-3 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          Back to Messages
        </button>
      </motion.div>
    </motion.div>
  );
}
