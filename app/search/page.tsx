'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FixedHeader } from '@/components/FixedHeader';
import { StoryCircle } from '@/components/StoryCircle';
import { useProtocolRadio } from '@/hooks/useProtocolRadio';
import { Volume2, VolumeX, SkipForward, Play } from 'lucide-react';

type SearchTab = 'gigs' | 'pics' | 'videos' | 'audio';

interface SearchResult {
  id: string;
  type: 'gig' | 'post';
  content: any;
  verified_name?: string;
  username: string;
  user_id: string;
  created_at: string;
  media_url?: string;
  has_budge?: boolean;
}

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<SearchTab>('gigs');
  const [stories, setStories] = useState<any[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    currentFrequency,
    isPlaying,
    isMuted,
    loading: radioLoading,
    playNextFrequency,
    toggleMute,
    skipFrequency,
  } = useProtocolRadio();

  // Fetch Stories for horizontal row
  useEffect(() => {
    async function fetchStories() {
      const { data } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          media_url,
          duration,
          created_at,
          profiles!stories_user_id_fkey (
            username,
            avatar_url,
            verified_name
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setStories(data);
      }
    }

    fetchStories();
  }, []);

  // Fetch tab content
  useEffect(() => {
    async function fetchTabContent() {
      setLoading(true);

      try {
        if (activeTab === 'gigs') {
          // Fetch active Gigs
          const { data } = await supabase
            .from('gigs')
            .select(`
              id,
              title,
              description,
              location,
              datetime,
              budget_amount,
              user_id,
              is_completed,
              created_at,
              profiles!gigs_user_id_fkey (
                username,
                verified_name,
                avatar_url
              )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(50);

          if (data) {
            setResults(data.map(gig => ({
              id: gig.id,
              type: 'gig' as const,
              content: gig,
              verified_name: gig.profiles?.verified_name,
              username: gig.profiles?.username || 'Unknown',
              user_id: gig.user_id,
              created_at: gig.created_at,
              has_budge: gig.budget_amount > 0,
            })));
          }
        } else if (activeTab === 'pics') {
          // Fetch image posts
          const { data } = await supabase
            .from('wall_messages')
            .select(`
              id,
              message_text,
              media_url,
              user_id,
              username,
              created_at,
              profiles!wall_messages_user_id_fkey (
                verified_name,
                avatar_url
              )
            `)
            .eq('message_type', 'image')
            .not('media_url', 'is', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

          if (data) {
            setResults(data.map(post => ({
              id: post.id,
              type: 'post' as const,
              content: post,
              verified_name: post.profiles?.verified_name,
              username: post.username,
              user_id: post.user_id,
              created_at: post.created_at,
              media_url: post.media_url,
            })));
          }
        } else if (activeTab === 'videos') {
          // Fetch video posts
          const { data } = await supabase
            .from('wall_messages')
            .select(`
              id,
              message_text,
              media_url,
              user_id,
              username,
              created_at,
              profiles!wall_messages_user_id_fkey (
                verified_name,
                avatar_url
              )
            `)
            .eq('message_type', 'video')
            .not('media_url', 'is', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

          if (data) {
            setResults(data.map(post => ({
              id: post.id,
              type: 'post' as const,
              content: post,
              verified_name: post.profiles?.verified_name,
              username: post.username,
              user_id: post.user_id,
              created_at: post.created_at,
              media_url: post.media_url,
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch tab content:', error);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab !== 'audio') {
      fetchTabContent();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  // Auto-start Audio Radio when tab becomes active
  useEffect(() => {
    if (activeTab === 'audio' && !currentFrequency && !radioLoading) {
      playNextFrequency();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <FixedHeader title="Search Radio" />

      {/* Stories Row - Always visible on all tabs */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <StoryCircle
              key={story.id}
              username={story.profiles?.username || 'Unknown'}
              avatarUrl={story.profiles?.avatar_url}
              hasStory={true}
              isLive={false}
              storyId={story.id}
            />
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10">
        {(['gigs', 'pics', 'videos', 'audio'] as SearchTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-[#FFD700]'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab === 'audio' ? 'Audio Radio' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'audio' ? (
          // Audio Radio Interface
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-white/60 text-sm">
                    {isPlaying ? 'LIVE FREQUENCY' : 'RADIO IDLE'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={skipFrequency}
                    disabled={radioLoading}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {currentFrequency ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {isMuted ? (
                      <span className="text-white/40">Tap to reveal identity</span>
                    ) : (
                      currentFrequency.verified_name
                    )}
                  </div>
                  {!isMuted && (
                    <div className="text-white/40 text-sm mb-4">
                      @{currentFrequency.username}
                    </div>
                  )}
                  <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#FFD700] transition-all"
                      style={{
                        width: isPlaying ? '100%' : '0%',
                        transition: 'width 30s linear',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={playNextFrequency}
                    disabled={radioLoading}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-[#FFD700] text-black rounded-full font-medium hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    Start Radio
                  </button>
                </div>
              )}
            </div>

            <div className="text-center text-white/40 text-sm">
              <p className="mb-2">🎙️ The Pulse</p>
              <p>Tune into the verified frequencies of your community</p>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center text-white/40 py-12">Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-white/40 py-12">
            No {activeTab} found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className={`bg-white/5 rounded-lg overflow-hidden border ${
                  result.has_budge
                    ? 'border-[#FFD700] animate-[gigFlicker_6s_ease-in-out_infinite]'
                    : 'border-white/10'
                }`}
              >
                {result.media_url && (
                  <div className="aspect-square bg-black">
                    {activeTab === 'videos' ? (
                      <video
                        src={result.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={result.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                <div className="p-3">
                  <div className="text-white font-medium text-sm mb-1">
                    {result.verified_name || result.username}
                  </div>
                  <div className="text-white/40 text-xs">
                    @{result.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
