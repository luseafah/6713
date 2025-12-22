'use client';

/**
 * Example integration of all UI interaction components in Hue page
 * Copy and adapt this code to your existing /app/hue/page.tsx
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// New interaction components
import RedXUploadButton from '@/components/RedXUploadButton';
import HamburgerMenu from '@/components/HamburgerMenu';
import { 
  HueInteractionMenu,
  SilentToggle,
  BreatheRefresh,
  ArtistTypographyButton 
} from '@/components/HueInteractionNooks';
import { 
  ModInfiniteEdit,
  TicketDropdown,
  HashtagSlasher,
  ModActionIndicator 
} from '@/components/ModInfiniteActions';
import { ActivityLogInline } from '@/components/ActivityLog';

// Existing components
import { WallMessage } from '@/types/database';
import LiveVideoCard from '@/components/LiveVideoCard';
import StoryCircle from '@/components/StoryCircle';
import TimeAgo from '@/components/TimeAgo';

export default function HuePageIntegrationExample() {
  // State management
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [viewAsStranger, setViewAsStranger] = useState(false);
  
  const [stories, setStories] = useState<WallMessage[]>([]);
  const [feed, setFeed] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    initializePage();
    
    // Listen for view mode changes
    const handleViewModeChange = (e: CustomEvent) => {
      setViewAsStranger(e.detail.viewAsStranger);
    };
    
    window.addEventListener('viewModeChanged', handleViewModeChange as EventListener);
    return () => window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
  }, []);

  const initializePage = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get user permissions
      const { data: userData } = await supabase
        .from('users')
        .select('is_verified, is_mod, is_admin')
        .eq('id', user.id)
        .single();

      if (userData) {
        setIsVerified(userData.is_verified);
        setIsMod(userData.is_mod);
        setIsAdmin(userData.is_admin);
      }

      // Check localStorage for view mode
      const savedViewMode = localStorage.getItem('viewAsStranger') === 'true';
      setViewAsStranger(savedViewMode);

      // Load content
      await Promise.all([loadStories(), loadFeed()]);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    const { data } = await supabase
      .from('wall_messages')
      .select('*')
      .eq('post_type', 'story')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    setStories(data || []);
  };

  const loadFeed = async () => {
    const { data } = await supabase
      .from('wall_messages')
      .select('*')
      .eq('post_type', 'wall')
      .order('created_at', { ascending: false })
      .limit(20);

    setFeed(data || []);
  };

  const handleRefresh = async () => {
    await Promise.all([loadStories(), loadFeed()]);
  };

  const renderPost = (post: WallMessage) => {
    const isModerator = isMod || isAdmin;
    const showModControls = isModerator && !viewAsStranger;

    return (
      <div key={post.id} className="relative mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
        {/* Long Press Menu (All Users) */}
        <HueInteractionMenu
          postId={post.id}
          postUserId={post.user_id}
          currentUserId={currentUserId}
          isVerified={isVerified}
          onFavorite={() => console.log('Favorited')}
          onReport={() => console.log('Reported')}
          onShare={() => console.log('Shared')}
        />

        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Username */}
            <span className="text-white font-bold">@{post.username}</span>

            {/* Activity badge */}
            <ActivityLogInline postId={post.id} />
          </div>

          {/* Mod Controls (Hidden in Stranger View) */}
          {showModControls && (
            <div className="flex items-center gap-2">
              <ModInfiniteEdit
                postId={post.id}
                currentContent={post.content}
                currentHashtags={[]} // Parse from content
                onSave={() => loadFeed()}
              />
              
              <TicketDropdown
                postId={post.id}
                reportCount={0} // Get from reports table
                onOpenTicket={() => console.log('Ticket opened')}
                onForceSlash={() => {
                  // Remove from feed
                  setFeed(feed.filter(p => p.id !== post.id));
                }}
                onPin={() => console.log('Pinned')}
              />
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-3">
          {post.media_url && post.message_type === 'voice' ? (
            <LiveVideoCard
              videoUrl={post.media_url}
              username={post.username}
              content={post.content}
              isLive={false}
            />
          ) : post.media_url && post.message_type === 'picture' ? (
            <img
              src={post.media_url}
              alt={post.content}
              className="w-full rounded-lg"
            />
          ) : null}

          <p className="text-white mt-2">{post.content}</p>

          {/* Hashtags (with mod slasher) */}
          {post.content && post.content.match(/#\w+/g) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.content.match(/#\w+/g)!.map((tag, idx) => (
                showModControls ? (
                  <HashtagSlasher
                    key={idx}
                    hashtag={tag}
                    isSlashed={false}
                    onSlash={() => console.log('Hashtag slashed')}
                  />
                ) : (
                  <span key={idx} className="text-blue-400">{tag}</span>
                )
              ))}
            </div>
          )}
        </div>

        {/* Post Footer */}
        <div className="flex items-center justify-between text-xs text-white/40">
          <TimeAgo date={post.created_at} />
          <div className="flex items-center gap-4">
            <span>❤️ 0</span>
            <span>💬 0</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Breathe Refresh (Always Active) */}
      <BreatheRefresh onRefresh={handleRefresh} />

      {/* Header (Hidden in Silent Mode) */}
      {!silentMode && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Red X Upload Button (Center) */}
            {isVerified && !viewAsStranger && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <RedXUploadButton
                  isVerified={isVerified}
                  onUploadComplete={handleRefresh}
                />
              </div>
            )}

            {/* Spacer */}
            <div className="w-10" />
          </div>
        </header>
      )}

      {/* Silent Toggle (Always Visible) */}
      <SilentToggle
        isActive={silentMode}
        onToggle={() => setSilentMode(!silentMode)}
      />

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        userId={currentUserId || ''}
      />

      {/* Main Content */}
      <main className="pt-20 pb-24 px-4">
        {/* Stories Row (Hidden in Silent Mode) */}
        {!silentMode && stories.length > 0 && (
          <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4">
              {stories.map(story => (
                <StoryCircle
                  key={story.id}
                  story={story}
                  onClick={() => console.log('Open story viewer')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/40 animate-pulse">Loading...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map(renderPost)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
