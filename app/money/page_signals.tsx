'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FixedHeader } from '@/components/FixedHeader';
import { TrendingUp, TrendingDown, Upload, Bell, BellOff, Coins, Megaphone } from 'lucide-react';
import AnnouncementCard from '@/components/AnnouncementCard';

type MoneyTab = 'signals' | 'announcements';

interface SignalPost {
  id: string;
  signal_type: 'forex' | 'crypto' | 'announcement';
  title: string;
  content: string;
  chart_url?: string;
  metadata: any;
  created_at: string;
  profiles: {
    username: string;
    is_admin: boolean;
  };
}

interface Announcement {
  id: string;
  content: string;
  media_url?: string;
  donation_goal?: number;
  current_donations: number;
  goal_reached: boolean;
  mentioned_user_id?: string;
  mentioned_username?: string;
  created_at: string;
}

export default function MoneyPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as MoneyTab) || 'signals';
  
  const [activeTab, setActiveTab] = useState<MoneyTab>(initialTab);
  const [signals, setSignals] = useState<SignalPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [talentBalance, setTalentBalance] = useState(0);

  // Fetch user status
  useEffect(() => {
    async function fetchUserStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_verified')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setIsAdmin(profile.is_admin);
        setIsVerified(profile.is_verified);
      }

      // Fetch talent balance
      const { data: userData } = await supabase
        .from('users')
        .select('talent_balance')
        .eq('id', user.id)
        .single();
      
      setTalentBalance(userData?.talent_balance || 0);
    }

    fetchUserStatus();
  }, []);

  // Fetch signals
  useEffect(() => {
    if (activeTab !== 'signals') return;

    async function fetchSignals() {
      setLoading(true);

      const { data, error } = await supabase
        .from('signal_posts')
        .select(`
          id,
          signal_type,
          title,
          content,
          chart_url,
          metadata,
          created_at,
          profiles!signal_posts_created_by_fkey (
            username,
            is_admin
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && !error) {
        setSignals(data as any);
      }

      setLoading(false);
    }

    fetchSignals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('signal_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signal_posts',
        },
        () => {
          fetchSignals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // Fetch announcements
  useEffect(() => {
    if (activeTab !== 'announcements') return;

    async function fetchAnnouncements() {
      setLoading(true);

      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setAnnouncements(data);
      }

      setLoading(false);
    }

    fetchAnnouncements();
  }, [activeTab]);

  // Fetch unread count for verified users
  useEffect(() => {
    if (!isVerified) return;

    async function fetchUnreadCount() {
      const { data } = await supabase.rpc('get_unread_signal_count');
      if (data !== null) {
        setUnreadCount(data);
      }
    }

    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isVerified]);

  const getSignalIcon = (type: string, metadata: any) => {
    if (type === 'forex' || type === 'crypto') {
      const direction = metadata?.direction || 'neutral';
      return direction === 'long' || direction === 'buy' ? (
        <TrendingUp className="w-5 h-5 text-green-500" />
      ) : direction === 'short' || direction === 'sell' ? (
        <TrendingDown className="w-5 h-5 text-red-500" />
      ) : (
        <Bell className="w-5 h-5 text-[#FFD700]" />
      );
    }
    return <Bell className="w-5 h-5 text-[#FFD700]" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <FixedHeader title="$$$4U - Money & Signals" />

      {/* Talent Balance Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-[#FFD700]" />
            <div>
              <div className="text-white text-2xl font-bold">{talentBalance}T</div>
              <div className="text-white/60 text-sm">Your Talent Balance</div>
            </div>
          </div>

          {/* Notification Badge (Verified Users Only) */}
          {isVerified && !isAdmin && unreadCount > 0 && (
            <div className="relative">
              <Bell className="w-6 h-6 text-[#FFD700]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('signals')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'signals'
                ? 'bg-[#FFD700] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Signals
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'announcements'
                ? 'bg-[#FFD700] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Announcements
          </button>
        </div>
      </div>

      {/* Gate Notice for Unverified (Signals Tab Only) */}
      {activeTab === 'signals' && !isVerified && !isAdmin && (
        <div className="mx-4 mt-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BellOff className="w-5 h-5 text-[#FFD700] mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Verification Required</h3>
              <p className="text-white/60 text-sm">
                You can view signals, but only Verified Users receive push notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Post Button (Signals Tab Only) */}
      {activeTab === 'signals' && isAdmin && (
        <div className="px-4 pt-4">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD700] text-black rounded-lg font-medium hover:bg-[#FFD700]/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Post Signal (Pope AI)
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center text-white/40 py-12">Loading...</div>
        ) : activeTab === 'signals' ? (
          signals.length === 0 ? (
            <div className="text-center text-white/40 py-12">
              No signals yet. {isAdmin && 'Post the first signal!'}
            </div>
          ) : (
            signals.map((signal) => (
              <div
                key={signal.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getSignalIcon(signal.signal_type, signal.metadata)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{signal.title}</span>
                        {signal.profiles?.is_admin && (
                          <span className="text-xs px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] rounded-full font-medium">
                            POPE AI
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs">
                        {signal.signal_type.toUpperCase()} • {formatTimestamp(signal.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-white/80 text-sm mb-3 whitespace-pre-wrap">
                  {signal.content}
                </p>

                {/* Chart */}
                {signal.chart_url && (
                  <div className="rounded-lg overflow-hidden bg-black border border-white/10">
                    <img
                      src={signal.chart_url}
                      alt="Signal chart"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Metadata */}
                {signal.metadata && Object.keys(signal.metadata).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {signal.metadata.pair && (
                      <div className="bg-white/5 rounded px-2 py-1">
                        <span className="text-white/40">Pair: </span>
                        <span className="text-white font-medium">{signal.metadata.pair}</span>
                      </div>
                    )}
                    {signal.metadata.entry && (
                      <div className="bg-white/5 rounded px-2 py-1">
                        <span className="text-white/40">Entry: </span>
                        <span className="text-white font-medium">{signal.metadata.entry}</span>
                      </div>
                    )}
                    {signal.metadata.stop_loss && (
                      <div className="bg-white/5 rounded px-2 py-1">
                        <span className="text-white/40">SL: </span>
                        <span className="text-red-400 font-medium">{signal.metadata.stop_loss}</span>
                      </div>
                    )}
                    {signal.metadata.take_profit && (
                      <div className="bg-white/5 rounded px-2 py-1">
                        <span className="text-white/40">TP: </span>
                        <span className="text-green-400 font-medium">{signal.metadata.take_profit}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          announcements.length === 0 ? (
            <div className="text-center text-white/40 py-12">No announcements yet</div>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                currentUserId={currentUserId}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}
