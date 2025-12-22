'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Flag, Share2, Eye, EyeOff, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HueInteractionMenuProps {
  postId: string;
  postUserId: string;
  currentUserId: string | null;
  isVerified: boolean;
  onFavorite?: () => void;
  onReport?: () => void;
  onShare?: () => void;
}

export function HueInteractionMenu({
  postId,
  postUserId,
  currentUserId,
  isVerified,
  onFavorite,
  onReport,
  onShare
}: HueInteractionMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setMenuPosition({ x: touch.clientX, y: touch.clientY });

    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMenuPosition({ x: e.clientX, y: e.clientY });

    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleFavorite = async () => {
    if (!currentUserId || !isVerified) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: currentUserId,
          message_id: postId
        });

      if (error && error.code !== '23505') { // Ignore duplicate error
        throw error;
      }

      onFavorite?.();
      setShowMenu(false);
    } catch (err) {
      console.error('Error favoriting:', err);
    }
  };

  const handleReport = () => {
    onReport?.();
    setShowMenu(false);
  };

  const handleShare = async () => {
    // Generate slash link
    const slashLink = `${window.location.origin}/p/${postId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: '6713 Post',
          url: slashLink
        });
      } else {
        await navigator.clipboard.writeText(slashLink);
        alert('Link copied to clipboard!');
      }
      onShare?.();
      setShowMenu(false);
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="absolute inset-0 z-10"
        style={{ pointerEvents: showMenu ? 'none' : 'auto' }}
      />

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[100]"
            style={{
              left: `${Math.min(menuPosition.x, window.innerWidth - 200)}px`,
              top: `${Math.min(menuPosition.y, window.innerHeight - 200)}px`,
            }}
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-3 space-y-2 min-w-[180px]">
              {isVerified && (
                <button
                  onClick={handleFavorite}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <Star size={18} className="text-yellow-400" />
                  <span className="text-white text-sm font-medium">Favorite (1/5)</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Share2 size={18} className="text-blue-400" />
                <span className="text-white text-sm font-medium">Share Link</span>
              </button>

              <button
                onClick={handleReport}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-red-600/20 rounded-lg transition-colors text-left"
              >
                <Flag size={18} className="text-red-400" />
                <span className="text-white text-sm font-medium">Report</span>
              </button>

              <button
                onClick={() => setShowMenu(false)}
                className="w-full p-2 text-white/40 text-xs hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SilentToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function SilentToggle({ isActive, onToggle }: SilentToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-all"
      aria-label={isActive ? 'Show UI' : 'Hide UI'}
    >
      {isActive ? (
        <Eye size={20} className="text-white" />
      ) : (
        <EyeOff size={20} className="text-white/60" />
      )}
    </button>
  );
}

interface BreatheRefreshProps {
  onRefresh: () => Promise<void>;
}

export function BreatheRefresh({ onRefresh }: BreatheRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    setPullDistance(Math.min(distance, PULL_THRESHOLD));
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setCountdown(7);

      // Countdown animation
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Wait 7 seconds before refreshing
      setTimeout(async () => {
        await onRefresh();
        setIsRefreshing(false);
      }, 7000);
    }

    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute top-0 left-0 right-0 h-20 z-20"
        style={{ pointerEvents: window.scrollY === 0 ? 'auto' : 'none' }}
      />

      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[90] bg-black/95 backdrop-blur-xl border-b border-white/20 flex items-center justify-center"
            style={{ height: `${Math.max(80, pullDistance)}px` }}
          >
            {isRefreshing ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {countdown}
                </div>
                <div className="text-white/60 text-sm tracking-widest uppercase">
                  Breathe...
                </div>
              </div>
            ) : (
              <div className="text-white/40 text-sm">
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface ArtistTypographyButtonProps {
  artistName: string;
  soundId: string;
  customStyles?: string;
  onNavigate?: () => void;
}

export function ArtistTypographyButton({
  artistName,
  soundId,
  customStyles,
  onNavigate
}: ArtistTypographyButtonProps) {
  const handleClick = () => {
    // Navigate to sound page
    window.location.href = `/sounds/${soundId}`;
    onNavigate?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`font-bold hover:opacity-80 transition-opacity ${customStyles || 'text-white text-lg'}`}
      style={{
        fontFamily: customStyles ? 'inherit' : 'Arial',
        letterSpacing: '0.05em'
      }}
    >
      {artistName}
    </button>
  );
}
