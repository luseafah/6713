'use client';

import { useEffect, useState } from 'react';
import AppWrapper from '@/components/AppWrapper';
import StoryCircle from '@/components/StoryCircle';
import { supabase } from '@/lib/supabase/client';
import { WallMessage } from '@/types/database';
import { Gig } from '@/types/gig';

interface LiveUser {
  story: WallMessage;
  isLive: boolean;
  liveStreamDuration?: number;
  hasActiveBudgeGig: boolean;
}

export default function LivePage() {
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  useEffect(() => {
    fetchLiveUsers();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveUsers = async () => {
    try {
      // Fetch recent stories (within 24 hours)
      const { data: stories } = await supabase
        .from('wall_messages')
        .select('*')
        .eq('post_type', 'story')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Fetch all active gigs
      const { data: gigs } = await supabase
        .from('gigs')
        .select('user_id, budge_enabled')
        .eq('is_completed', false);

      if (stories) {
        // Map stories to LiveUser format
        const users: LiveUser[] = stories.map(story => {
          const userGigs = gigs?.filter(g => g.user_id === story.user_id) || [];
          const hasActiveBudgeGig = userGigs.some(g => g.budge_enabled);
          
          // For demo: simulate some users as "live streaming"
          // In production, you'd have a live_sessions table
          const isLive = Math.random() > 0.7; // 30% chance of being "live"
          const liveStreamDuration = isLive 
            ? Math.floor(Math.random() * 7200) + 60 // Random 1min to 2hr
            : undefined;

          return {
            story,
            isLive,
            liveStreamDuration,
            hasActiveBudgeGig,
          };
        });

        // Sort: Live + Budge first, then Live, then Budge, then standard
        users.sort((a, b) => {
          const aScore = (a.isLive ? 100 : 0) + (a.hasActiveBudgeGig ? 10 : 0);
          const bScore = (b.isLive ? 100 : 0) + (b.hasActiveBudgeGig ? 10 : 0);
          return bScore - aScore;
        });

        setLiveUsers(users);
      }
    } catch (error) {
      console.error('Error fetching live users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-black min-h-screen">
      <AppWrapper onNavigate={handleNavigate}>
        <div className="pt-20 px-4 pb-24">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6">
            <h1 className="text-white text-2xl font-bold mb-2">Live</h1>
            <p className="text-white/60 text-sm">
              Watch live streams or browse active Gigs
            </p>
          </div>

          {/* Story Row */}
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : liveUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40">No active stories or live streams</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
                {liveUsers.map((user, index) => (
                  <StoryCircle
                    key={user.story.id || index}
                    story={user.story}
                    isLive={user.isLive}
                    hasActiveBudgeGig={user.hasActiveBudgeGig}
                    liveStreamDuration={user.liveStreamDuration}
                    onClick={() => {
                      // In production: open live stream viewer or gig detail
                      console.log('Clicked:', user.story.username, {
                        isLive: user.isLive,
                        hasGig: user.hasActiveBudgeGig
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Visual Hierarchy Reference */}
          <div className="max-w-7xl mx-auto mt-12 bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">Visual State Guide</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flicker-border"></div>
                <span className="text-white/80">Live + Budge Gig:</span>
                <span className="text-white/60">Yellow/Red flicker + Duration badge</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full live-border"></div>
                <span className="text-white/80">Live Only:</span>
                <span className="text-white/60">Pulsing red + Duration badge</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flicker-border"></div>
                <span className="text-white/80">Gig Only (Budge ON):</span>
                <span className="text-white/60">Yellow/Red flicker + No badge</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full ring-2 ring-white/30"></div>
                <span className="text-white/80">Standard Story:</span>
                <span className="text-white/60">Grey border + No badge</span>
              </div>
            </div>
          </div>
        </div>
      </AppWrapper>
    </main>
  );
}
