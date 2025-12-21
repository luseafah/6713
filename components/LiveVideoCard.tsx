'use client';

import { useEffect, useRef, useState } from 'react';
import { formatViewerCount, formatLikeCount } from '@/lib/metricsCap';

interface LiveVideoCardProps {
  videoUrl: string;
  username: string;
  content?: string;
  isLive?: boolean;
  viewerCount?: number;
  likeCount?: number;
}

export default function LiveVideoCard({ 
  videoUrl, 
  username, 
  content,
  isLive = false,
  viewerCount = 0,
  likeCount = 0
}: LiveVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          
          // Play when 50% visible, pause when not
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(err => {
              console.log('Autoplay prevented:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0, 0.5, 1], // Trigger at 0%, 50%, and 100% visibility
        rootMargin: '0px'
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black group">
      {/* Video Player */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        muted
        playsInline
        preload="metadata"
        className="w-full h-auto object-cover"
        onError={(e) => {
          console.error('Video failed to load:', videoUrl);
        }}
      />

      {/* LIVE Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold uppercase">LIVE</span>
          </div>
        </div>
      )}

      {/* Content Overlay */}
      {(username || content || isLive) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="text-white space-y-2">
            {/* Engagement Metrics - 6713 Ceiling */}
            {isLive && (
              <div className="flex items-center gap-4 text-xs font-medium mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white/80">{formatViewerCount(viewerCount)} Viewers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-500">❤️</span>
                  <span className="text-white/80">{formatLikeCount(likeCount)} Likes</span>
                </div>
              </div>
            )}
            
            {username && (
              <p className="font-bold text-sm">{username}</p>
            )}
            {content && (
              <p className="text-sm text-white/80 line-clamp-2">{content}</p>
            )}
          </div>
        </div>
      )}

      {/* Play/Pause Indicator (optional visual feedback) */}
      {!isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[12px] border-y-transparent ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
