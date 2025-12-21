'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import DeactivationCheck from '@/components/DeactivationCheck';
import AppWrapper from '@/components/AppWrapper';
import StoryCircle from '@/components/StoryCircle';
import LiveVideoCard from '@/components/LiveVideoCard';
import GigCard from '@/components/GigCard';
import Username from '@/components/Username';
import TimeAgo from '@/components/TimeAgo';
import { WallMessage } from '@/types/database';
import { Gig } from '@/types/gig';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';

export default function HuePage() {
  const [stories, setStories] = useState<WallMessage[]>([]);
  const [feed, setFeed] = useState<WallMessage[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersWithActiveGigs, setUsersWithActiveGigs] = useState<Set<string>>(new Set());
  const observerRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 10;

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  // Fetch stories (active stories that haven't expired)
  const loadStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wall_messages')
        .select('*')
        .eq('post_type', 'story')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  }, []);

  // Fetch gigs (incomplete gigs with user info and active story check)
  const loadGigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          profiles!gigs_user_id_fkey (
            user_display_name,
            profile_photo
          )
        `)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Track users with active gigs for Yellow "+" indicator
      const activeGigUserIds = new Set((data || []).map(gig => gig.user_id));
      setUsersWithActiveGigs(activeGigUserIds);

      // Check for active stories (budge gigs)
      const gigsWithStories = await Promise.all(
        (data || []).map(async (gig) => {
          const { data: storyData } = await supabase
            .from('wall_messages')
            .select('id')
            .eq('user_id', gig.user_id)
            .eq('post_type', 'story')
            .gt('expires_at', new Date().toISOString())
            .limit(1);

          return {
            ...gig,
            user_display_name: gig.profiles?.user_display_name,
            profile_photo: gig.profiles?.profile_photo,
            has_active_story: (storyData && storyData.length > 0) || false
          };
        })
      );

      setGigs(gigsWithStories);
    } catch (error) {
      console.error('Error loading gigs:', error);
    }
  }, []);

  // Fetch feed posts (wall posts only)
  const loadFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;

      const { data, error } = await supabase
        .from('wall_messages')
        .select('*')
        .eq('post_type', 'wall')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1);

      if (error) throw error;

      if (data && data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      if (reset) {
        setFeed(data || []);
      } else {
        setFeed(prev => [...prev, ...(data || [])]);
      }

      setOffset(currentOffset + POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Load data
      await Promise.all([loadStories(), loadGigs(), loadFeed(true)]);
    };
    init();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          loadFeed(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loadFeed, loadingMore, hasMore]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStories(), loadGigs(), loadFeed(true)]);
  }, [loadStories, loadGigs, loadFeed]);

  // Render different post types
  const renderPost = (post: WallMessage) => {
    // Check if post creator has active budge gig
    const hasActiveBudgeGig = gigs.some(
      gig => gig.user_id === post.user_id && gig.gig_type === 'budge' && gig.has_active_story
    );

    const profilePhotoElement = post.profile_photo ? (
      <img
        src={post.profile_photo}
        alt={post.username}
        className={`w-8 h-8 rounded-full object-cover ${
          hasActiveBudgeGig ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : ''
        }`}
      />
    ) : (
      <div
        className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm ${
          hasActiveBudgeGig ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : ''
        }`}
      >
        {post.username?.charAt(0).toUpperCase()}
      </div>
    );

    // Video post
    if (post.media_url && post.message_type === 'voice') {
      return (
        <div key={post.id} className="mb-4">
          <LiveVideoCard
            videoUrl={post.media_url}
            username={post.username}
            content={post.content}
            isLive={post.is_pope_ai}
          />
        </div>
      );
    }

    // Image post
    if (post.media_url && post.message_type === 'picture') {
      return (
        <div
          key={post.id}
          className="mb-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
        >
          <img
            src={post.media_url}
            alt={post.content || 'Post image'}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          {post.content && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {profilePhotoElement}
                <Username 
                  username={post.username}
                  userId={post.user_id}
                  hasActiveGig={usersWithActiveGigs.has(post.user_id)}
                  className="font-bold text-white text-sm"
                />
                {post.is_pope_ai && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                    POPE AI
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm mb-2">{post.content}</p>
              <TimeAgo 
                date={post.created_at} 
                className="text-white/40 text-xs"
              />
            </div>
          )}
        </div>
      );
    }

    // Text-only post
    return (
      <div
        key={post.id}
        className="mb-4 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-orange-900/30 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
      >
        <div className="flex items-center gap-2 mb-3">
          {profilePhotoElement}
          <Username 
            username={post.username}
            userId={post.user_id}
            hasActiveGig={usersWithActiveGigs.has(post.user_id)}
            className="font-bold text-white"
          />
          {post.is_pope_ai && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
              POPE AI
            </span>
          )}
          {post.is_coma_whisper && (
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
              COMA
            </span>
          )}
        </div>
        <p className="text-white text-lg leading-relaxed mb-3">{post.content}</p>
        <div className="flex items-center justify-between">
          <TimeAgo 
            date={post.created_at} 
            className="text-white/40 text-xs"
          />
          <div className="flex items-center gap-4 text-white/40">
            <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <Heart size={16} />
            </button>
            <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppWrapper onNavigate={handleNavigate}>
      <DeactivationCheck>
        <main className="bg-black min-h-screen pb-20">
          {/* Stories Row */}
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 py-4">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 min-w-max">
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <StoryCircle
                      key={story.id}
                      story={story}
                      onClick={() => {
                        // TODO: Open story viewer modal
                        console.log('Open story:', story.id);
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full py-4">
                    <p className="text-white/40 text-sm">No active stories</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pull to Refresh Hint */}
          <div className="text-center py-4">
            <button
              onClick={handleRefresh}
              className="text-white/40 text-xs hover:text-white/60 transition-colors"
            >
              ↓ Pull to refresh
            </button>
          </div>

          {/* Feed */}
          <div className="max-w-2xl mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-white/40" size={32} />
              </div>
            ) : feed.length > 0 ? (
              <>
                {feed.map((post, index) => {
                  const feedItems = [];
                  
                  // Add the post
                  feedItems.push(renderPost(post));
                  
                  // Add a gig card every 3 posts
                  if ((index + 1) % 3 === 0 && gigs.length > 0) {
                    const gigIndex = Math.floor(index / 3) % gigs.length;
                    const gig = gigs[gigIndex];
                    feedItems.push(
                      <div key={`gig-${gig.id}`} className="mb-4">
                        <GigCard gig={gig} currentUserId={currentUserId} />
                      </div>
                    );
                  }
                  
                  return feedItems;
                })}
                
                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div ref={observerRef} className="py-8 flex justify-center">
                    {loadingMore && (
                      <Loader2 className="animate-spin text-white/40" size={24} />
                    )}
                  </div>
                )}

                {!hasMore && (
                  <div className="text-center py-8">
                    <p className="text-white/40 text-sm">You've reached the end</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/40">No posts yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </main>
      </DeactivationCheck>
    </AppWrapper>
  );
}
