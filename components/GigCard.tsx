'use client';

import { useState } from 'react';
import { Briefcase, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { Gig } from '@/types/gig';
import { supabase } from '@/lib/supabase';

interface GigCardProps {
  gig: Gig;
  currentUserId?: string;
}

export default function GigCard({ gig, currentUserId }: GigCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleApply = async () => {
    if (!currentUserId || isApplying) return;

    setIsApplying(true);
    
    // In a full implementation, this would:
    // 1. Send a DM to the gig poster
    // 2. Create an application record
    // 3. Notify the poster
    
    // For now, we'll just show success
    setTimeout(() => {
      setShowSuccess(true);
      setIsApplying(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20 border-2 border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all">
      {/* Header with user info */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/hue?user=${gig.user_id}`}>
          {gig.user_profile_photo ? (
            <img
              src={gig.user_profile_photo}
              alt={gig.user_display_name || 'User'}
              className={`w-12 h-12 rounded-full object-cover ${
                gig.budge_enabled && gig.user_has_story ? 'flicker-border' :
                gig.budge_enabled ? 'budge-border' : 'border-2 border-purple-500/50'
              }`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center ${
              gig.budge_enabled && gig.user_has_story ? 'flicker-border' :
              gig.budge_enabled ? 'budge-border' : 'border-2 border-purple-500/50'
            }`}>
              <User className="w-6 h-6 text-purple-400" />
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link href={`/hue?user=${gig.user_id}`}>
            <p className="text-white font-semibold hover:text-purple-400 transition-colors">
              {gig.user_display_name || 'Anonymous'}
            </p>
          </Link>
          <p className="text-white/40 text-xs">
            Posted {new Date(gig.created_at).toLocaleDateString()}
          </p>
        </div>
        {gig.budge_enabled && (
          <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full">
            <span className="text-yellow-400 text-xs font-semibold">BUDGE</span>
          </div>
        )}
      </div>

      {/* Gig Icon */}
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
        <Briefcase className="w-7 h-7 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">{gig.title}</h3>

      {/* Description */}
      <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
        {gig.description}
      </p>

      {/* Reward */}
      <div className="flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <span className="text-white/60 text-sm">Reward:</span>
        <span className="text-purple-400 text-lg font-bold font-mono">
          {gig.talent_reward} Talents
        </span>
      </div>

      {/* Apply Button */}
      {currentUserId && currentUserId !== gig.user_id && (
        <>
          {showSuccess ? (
            <div className="w-full bg-green-500/20 border border-green-500/50 rounded-lg py-3 text-center">
              <span className="text-green-400 font-semibold">✓ Application Sent!</span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? 'Applying...' : 'Apply for This Gig'}
            </button>
          )}
        </>
      )}

      {currentUserId === gig.user_id && (
        <div className="text-center text-purple-400/70 text-sm font-semibold">
          Your Gig
        </div>
      )}
    </div>
  );
}
