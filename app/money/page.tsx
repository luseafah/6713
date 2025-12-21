'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnnouncementCard from '@/components/AnnouncementCard';
import AppWrapper from '@/components/AppWrapper';
import DeactivationCheck from '@/components/DeactivationCheck';

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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [talentBalance, setTalentBalance] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: userData } = await supabase
          .from('users')
          .select('talent_balance')
          .eq('id', user.id)
          .single();
        
        setTalentBalance(userData?.talent_balance || 0);
      }
    };
    
    fetchUser();
  }, []);

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('official_announcements')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to load announcements:', error);
      } else {
        setAnnouncements(data || []);
      }
      
      setIsLoading(false);
    };

    loadAnnouncements();
  }, []);

  // Real-time subscription for donation updates
  useEffect(() => {
    const channel = supabase
      .channel('donations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations'
        },
        async (payload: any) => {
          // Refresh announcement to show updated progress
          const { data } = await supabase
            .from('official_announcements')
            .select('*')
            .eq('id', payload.new.announcement_id)
            .single();

          if (data) {
            setAnnouncements(prev =>
              prev.map(ann => ann.id === data.id ? data : ann)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDonationComplete = (newBalance: number) => {
    setTalentBalance(newBalance);
  };

  return (
    <AppWrapper onNavigate={handleNavigate}>
      <DeactivationCheck>
        <div className="min-h-screen bg-black">
          {/* Header */}
          <div className="bg-gradient-to-br from-yellow-900/20 via-black to-yellow-900/20 border-b-2 border-yellow-500/30 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                  <Megaphone size={32} className="text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">$$$4U</h1>
                  <p className="text-yellow-400 text-sm font-semibold">OFFICIAL PROTOCOL CHANNEL</p>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      This is a <span className="text-yellow-400 font-semibold">strictly regulated</span> community channel. 
                      Only the last <span className="text-yellow-400 font-semibold">10 announcements</span> are displayed. 
                      You can <span className="text-yellow-400 font-semibold">donate Talent</span> to goals or{' '}
                      <span className="text-yellow-400 font-semibold">follow mentioned users</span>.
                    </p>
                    <p className="text-white/40 text-xs mt-2">
                      Comments and replies are disabled. This is a one-way humanitarian dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Talent Balance Display */}
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-yellow-400" />
                  <span className="text-white/60 text-sm">Your Balance:</span>
                </div>
                <span className="text-yellow-400 text-xl font-bold font-mono">
                  {talentBalance.toLocaleString()} Talent
                </span>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-white/60">Loading official announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <Megaphone size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No active announcements at this time.</p>
                <p className="text-white/20 text-sm mt-2">Check back later for official updates.</p>
              </div>
            ) : (
              <>
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    currentUserId={currentUserId}
                    talentBalance={talentBalance}
                    onDonationComplete={handleDonationComplete}
                  />
                ))}
              </>
            )}

            {/* Info Footer */}
            {announcements.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <p className="text-white/40 text-sm">
                  Showing {announcements.length} of max 10 announcements
                </p>
                <p className="text-white/20 text-xs mt-1">
                  Older announcements are automatically archived to maintain focus
                </p>
              </div>
            )}
          </div>
        </div>
      </DeactivationCheck>
    </AppWrapper>
  );
}
