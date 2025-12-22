'use client';

import { useState, useEffect } from 'react';
import { Eye, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePictureRevealProps {
  profilePhotoUrl?: string | null;
  blockerPreference: 'black' | 'white';
  viewedUserId: string;
  viewerUserId: string;
  viewerTalentBalance: number;
  onRevealPurchase: () => Promise<void>;
  className?: string;
}

export default function ProfilePictureReveal({
  profilePhotoUrl,
  blockerPreference,
  viewedUserId,
  viewerUserId,
  viewerTalentBalance,
  onRevealPurchase,
  className = '',
}: ProfilePictureRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showRevealPrompt, setShowRevealPrompt] = useState(false);

  // Check if viewer has already revealed this profile picture
  useEffect(() => {
    checkRevealStatus();
  }, [viewedUserId, viewerUserId]);

  const checkRevealStatus = async () => {
    if (viewedUserId === viewerUserId) {
      // Users always see their own picture
      setIsRevealed(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/profile/picture-reveal?viewer_id=${viewerUserId}&viewed_user_id=${viewedUserId}`
      );
      const data = await response.json();
      
      // Check if reveal exists and picture hasn't changed
      if (data.revealed && data.picture_url_at_reveal === profilePhotoUrl) {
        setIsRevealed(true);
      } else {
        setIsRevealed(false);
      }
    } catch (error) {
      console.error('Failed to check reveal status:', error);
      setIsRevealed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealPurchase = async () => {
    if (viewerTalentBalance < 1) {
      alert('You need at least 1 Talent to reveal this profile picture.');
      return;
    }

    const confirm = window.confirm(
      '💎 Spend 1 Talent to reveal this profile picture?\n\n' +
      'Once revealed, it stays revealed unless they change their picture.'
    );

    if (!confirm) return;

    setPurchasing(true);
    try {
      const response = await fetch('/api/profile/picture-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewer_id: viewerUserId,
          viewed_user_id: viewedUserId,
          picture_url: profilePhotoUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsRevealed(true);
        setShowRevealPrompt(false);
        await onRevealPurchase(); // Callback to refresh user's talent balance
      } else {
        alert(data.error || 'Failed to reveal picture');
      }
    } catch (error) {
      console.error('Failed to purchase reveal:', error);
      alert('Failed to reveal picture. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-zinc-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  // User viewing their own profile - always show
  if (viewedUserId === viewerUserId) {
    return (
      <div className={`relative ${className}`}>
        {profilePhotoUrl ? (
          <img
            src={profilePhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-white/50 text-sm">No photo</span>
          </div>
        )}
      </div>
    );
  }

  // Picture is revealed
  if (isRevealed) {
    return (
      <div className={`relative ${className}`}>
        {profilePhotoUrl ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={profilePhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-white/50 text-sm">No photo</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
          ✓ Revealed
        </div>
      </div>
    );
  }

  // Picture is blocked - show blocker with reveal option
  return (
    <div
      className={`relative ${className} cursor-pointer`}
      onMouseEnter={() => setShowRevealPrompt(true)}
      onMouseLeave={() => setShowRevealPrompt(false)}
      onClick={handleRevealPurchase}
    >
      {/* Blocker */}
      <div
        className={`w-full h-full rounded-lg flex items-center justify-center ${
          blockerPreference === 'black' ? 'bg-black' : 'bg-white'
        }`}
      >
        <Lock
          size={48}
          className={blockerPreference === 'black' ? 'text-white/30' : 'text-black/30'}
        />
      </div>

      {/* Reveal Prompt Overlay */}
      <AnimatePresence>
        {showRevealPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 p-4"
          >
            <Eye size={32} className="text-yellow-400" />
            <div className="text-center">
              <p className="text-white font-medium text-sm mb-1">
                Reveal Profile Picture
              </p>
              <p className="text-white/70 text-xs">
                1 Talent • Permanent
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRevealPurchase();
              }}
              disabled={purchasing || viewerTalentBalance < 1}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-700 disabled:text-white/50 text-black px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed"
            >
              {purchasing ? 'Revealing...' : viewerTalentBalance < 1 ? 'Not enough Talents' : 'Reveal for 1T'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
