'use client';

import { useState } from 'react';
import { ExternalLink, Play, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PrettyLinkProps {
  sharedPostId: string;
  previewMediaUrl: string;
  mediaType: 'photo' | 'video';
  soundName: string;
  artistUsername: string;
  artistTypographyStyle?: {
    fontFamily?: string;
    fontWeight?: string;
    fontSize?: string;
    color?: string;
    textShadow?: string;
    letterSpacing?: string;
    textTransform?: string;
    customCss?: Record<string, any>;
  };
  shareMessage?: string;
  sharerUsername: string;
  tapCount: number;
  createdAt: string;
  originalArtistId: string;
  originalPostId: string;
}

export default function PrettyLink({
  sharedPostId,
  previewMediaUrl,
  mediaType,
  soundName,
  artistUsername,
  artistTypographyStyle = {},
  shareMessage,
  sharerUsername,
  tapCount,
  createdAt,
  originalArtistId,
  originalPostId,
}: PrettyLinkProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [taps, setTaps] = useState(tapCount);

  const handleTap = async () => {
    try {
      // Track the tap
      const { data } = await supabase.rpc('track_pretty_link_tap', {
        p_shared_post_id: sharedPostId,
        p_tapper_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (data?.success) {
        setTaps(prev => prev + 1);
        
        // Redirect to artist's sound page
        router.push(`/hue/${originalArtistId}/${originalPostId}`);
      }
    } catch (error) {
      console.error('Error tracking Pretty Link tap:', error);
    }
  };

  // Apply artist's custom typography
  const soundNameStyle: React.CSSProperties = {
    fontFamily: artistTypographyStyle.fontFamily || 'Inter',
    fontWeight: artistTypographyStyle.fontWeight || '600',
    fontSize: artistTypographyStyle.fontSize || '1.125rem',
    color: artistTypographyStyle.color || '#FFFFFF',
    textShadow: artistTypographyStyle.textShadow || '0 2px 8px rgba(0,0,0,0.8)',
    letterSpacing: artistTypographyStyle.letterSpacing || '0.05em',
    textTransform: (artistTypographyStyle.textTransform as any) || 'uppercase',
    ...artistTypographyStyle.customCss,
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Share Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">
            <span className="text-white font-medium">@{sharerUsername}</span> shared
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>{taps} {taps === 1 ? 'tap' : 'taps'}</span>
        </div>
      </div>

      {/* Share Message (if provided) */}
      {shareMessage && (
        <div className="px-4 py-2 bg-zinc-800/50">
          <p className="text-white/80 text-sm">{shareMessage}</p>
        </div>
      )}

      {/* Pretty Link Card */}
      <button
        onClick={handleTap}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full relative group cursor-pointer"
      >
        {/* Media Preview */}
        <div className="relative aspect-video overflow-hidden bg-black">
          {mediaType === 'video' ? (
            <video
              src={previewMediaUrl}
              className="w-full h-full object-cover"
              loop
              muted
              autoPlay={isHovered}
              playsInline
            />
          ) : (
            <img
              src={previewMediaUrl}
              alt={soundName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Play Icon for Videos */}
          {mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`bg-white/20 backdrop-blur-sm rounded-full p-6 transition-all duration-300 ${
                isHovered ? 'scale-110 bg-white/30' : 'scale-100'
              }`}>
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}

          {/* Sound Name with Artist Typography */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3
              style={soundNameStyle}
              className="mb-2 transition-all duration-300"
            >
              {soundName}
            </h3>
            
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm">by @{artistUsername}</p>
              
              {/* Tap to View */}
              <div className={`flex items-center gap-2 text-white transition-all duration-300 ${
                isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}>
                <span className="text-sm font-medium">View Original</span>
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Hover Border Effect */}
          <div className={`absolute inset-0 border-4 border-green-500 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
        </div>
      </button>

      {/* Footer */}
      <div className="px-4 py-3 bg-zinc-800/30 text-center">
        <p className="text-white/40 text-xs tracking-wider">
          🔗 PRETTY LINK • TAP TO EXPLORE
        </p>
      </div>
    </div>
  );
}
