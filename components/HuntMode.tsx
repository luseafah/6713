'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Activity, MessageCircle, Heart, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface HuntModeProps {
  targetUserId: string;
  onExit: () => void;
}

interface ActivityLog {
  id: string;
  type: 'post' | 'dm' | 'like' | 'throw' | 'gig';
  content: string;
  timestamp: Date;
  metadata?: any;
}

/**
 * Hunt Protocol: Admin Surveillance Mode
 * "Ghost view" - See the app exactly as the target user sees it
 * Admin can view all activity, messages, and interactions
 */
export default function HuntMode({ targetUserId, onExit }: HuntModeProps) {
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalDMs: 0,
    totalLikes: 0,
    talentBalance: 0,
    lastActive: null as Date | null,
  });
  const router = useRouter();

  useEffect(() => {
    loadTargetData();
    const interval = setInterval(loadActivityLog, 5000); // Real-time updates
    return () => clearInterval(interval);
  }, [targetUserId]);

  const loadTargetData = async () => {
    // Load target user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profile) {
      setTargetProfile(profile);
      setStats(prev => ({
        ...prev,
        talentBalance: profile.talent_balance || 0,
      }));
    }

    // Load their stats
    const { data: posts } = await supabase
      .from('wall_messages')
      .select('id')
      .eq('user_id', targetUserId);

    const { data: dms } = await supabase
      .from('dm_messages')
      .select('id')
      .eq('from_user_id', targetUserId);

    setStats(prev => ({
      ...prev,
      totalPosts: posts?.length || 0,
      totalDMs: dms?.length || 0,
    }));

    loadActivityLog();
  };

  const loadActivityLog = async () => {
    const logs: ActivityLog[] = [];

    // Recent posts
    const { data: posts } = await supabase
      .from('wall_messages')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    posts?.forEach(post => {
      logs.push({
        id: post.id,
        type: 'post',
        content: post.content,
        timestamp: new Date(post.created_at),
      });
    });

    // Recent DMs
    const { data: dms } = await supabase
      .from('dm_messages')
      .select('*, dm_threads!inner(*)')
      .eq('from_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    dms?.forEach(dm => {
      logs.push({
        id: dm.id,
        type: 'dm',
        content: dm.content,
        timestamp: new Date(dm.created_at),
        metadata: { thread: dm.dm_threads },
      });
    });

    // Recent talent transactions
    const { data: transactions } = await supabase
      .from('talent_transactions')
      .select('*')
      .eq('from_user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    transactions?.forEach(tx => {
      logs.push({
        id: tx.id,
        type: 'throw',
        content: `Threw ${tx.amount}T to user`,
        timestamp: new Date(tx.created_at),
      });
    });

    // Sort all by timestamp
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivityLog(logs.slice(0, 20));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'dm':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'throw':
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-white/50" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* Ghost Mode Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-purple-950/20 pointer-events-none" />
      
      {/* Exit Button (Top Center) */}
      <motion.button
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        onClick={onExit}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[201] px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 rounded-full text-white font-bold flex items-center gap-2 transition-all group"
      >
        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        EXIT HUNT MODE
        <Eye className="w-5 h-5 animate-pulse" />
      </motion.button>

      {/* Hunt Status Bar */}
      <div className="fixed top-20 left-0 right-0 z-[201] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-7xl mx-auto bg-black/80 backdrop-blur-lg border border-red-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={targetProfile?.avatar_url || '/default-avatar.png'}
                  alt={targetProfile?.display_name}
                  className="w-16 h-16 rounded-full border-2 border-red-500"
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Eye className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div>
                <h2 className="text-white font-bold text-xl">
                  {targetProfile?.display_name || 'Unknown User'}
                </h2>
                <p className="text-white/60 text-sm">@{targetProfile?.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500 text-xs font-mono">HUNTING</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-white/50 text-xs uppercase">Posts</p>
                <p className="text-white font-mono text-lg">{stats.totalPosts}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase">DMs</p>
                <p className="text-white font-mono text-lg">{stats.totalDMs}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase">Talents</p>
                <p className="text-yellow-500 font-mono text-lg">{stats.talentBalance}T</p>
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase">Status</p>
                <p className={`font-mono text-lg ${
                  targetProfile?.is_verified ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {targetProfile?.is_verified ? '✓' : '⏳'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <div className="fixed top-40 left-0 right-0 bottom-0 z-[200] overflow-y-auto px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Activity Feed
          </h3>

          <div className="space-y-3">
            <AnimatePresence>
              {activityLog.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-black/60 backdrop-blur border border-white/10 rounded-xl p-4 hover:border-red-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getActivityIcon(log.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/60 text-xs uppercase tracking-wider">
                          {log.type}
                        </span>
                        <span className="text-white/40 text-xs font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-white text-sm leading-relaxed">
                        {log.content}
                      </p>
                      
                      {log.metadata && (
                        <div className="mt-2 text-white/30 text-xs">
                          {JSON.stringify(log.metadata, null, 2).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {activityLog.length === 0 && (
            <div className="text-center py-20 text-white/40">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No recent activity detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
