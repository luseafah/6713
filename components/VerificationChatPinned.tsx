'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface VerificationChatPinnedProps {
  userId: string;
}

/**
 * Pinned Pope AI Chat Preview
 * Shows at top of /messages for unverified users
 * Displays wait timer and verification status
 */
export default function VerificationChatPinned({ userId }: VerificationChatPinnedProps) {
  const [waitTime, setWaitTime] = useState(0);
  const [status, setStatus] = useState<'pending' | 'active' | 'verified'>('pending');
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (status === 'pending' && profile?.created_at) {
      // Calculate wait time from account creation
      const createdAt = new Date(profile.created_at);
      const updateTimer = () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
        setWaitTime(diff);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [status, profile]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      if (data.verified_at) {
        setStatus('verified');
      } else if (data.verification_status === 'active') {
        setStatus('active');
      } else {
        setStatus('pending');
      }
    }
  };

  const formatWaitTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'from-green-500/20 to-emerald-500/10 border-green-500/30';
      case 'pending':
        return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      default:
        return 'from-purple-500/20 to-pink-500/10 border-purple-500/30';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Chat Active';
      case 'pending':
        return 'On Hold';
      default:
        return 'Verified';
    }
  };

  if (status === 'verified') {
    return null; // Hide for verified users
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push('/messages/pope')}
      className={`relative mb-4 bg-gradient-to-br ${getStatusColor()} border rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden`}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Pope AI Avatar */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-purple-500 rounded-full flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            {status === 'active' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"
              />
            )}
          </div>

          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              Pope AI
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </h3>
            <p className="text-white/70 text-sm">
              {status === 'active' 
                ? 'Ready to verify you now!' 
                : 'Will reach out shortly...'}
            </p>
          </div>
        </div>

        <div className="text-right">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
            status === 'active' 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-yellow-500/20 text-yellow-500'
          }`}>
            {getStatusText()}
          </div>

          {/* Wait Timer */}
          {status === 'pending' && (
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatWaitTime(waitTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator for active status */}
      {status === 'active' && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Tap to open chat</span>
            <span className="text-green-500 font-bold">→</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
