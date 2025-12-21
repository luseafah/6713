'use client';

import { Heart } from 'lucide-react';
import { useLikeAnimation } from '@/lib/sensoryFeedback';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  displayCount: string; // "13+" or actual count
  onLike: () => void;
}

/**
 * Like Button with 13-Heart Burst Animation
 * 
 * Protocol: When user likes, trigger burst of 13 floating hearts
 * Stays true to the 13+ ceiling limit
 */
export default function LikeButton({ isLiked, likeCount, displayCount, onLike }: LikeButtonProps) {
  const { hearts, isAnimating, triggerLike } = useLikeAnimation();

  const handleLike = () => {
    if (!isLiked) {
      triggerLike();
    }
    onLike();
  };

  return (
    <button
      onClick={handleLike}
      className="relative flex flex-col items-center gap-1 group"
    >
      {/* Main Like Button */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-300 transform
          ${isLiked ? 'bg-red-500 scale-110' : 'bg-white/10 hover:bg-white/20'}
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        <Heart
          size={20}
          className={`
            transition-all duration-300
            ${isLiked ? 'fill-white text-white' : 'text-white'}
          `}
        />
      </div>

      {/* Like Count */}
      <span className="text-white text-xs font-medium">{displayCount}</span>

      {/* 13-Heart Burst Animation */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {hearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%)`,
                animation: `floatUp ${heart.duration}ms ease-out ${heart.delay}ms forwards`,
              }}
            >
              <Heart
                size={16}
                className="fill-red-500 text-red-500"
                style={{
                  transform: `translate(${heart.x}px, ${heart.y}px)`,
                  opacity: 0,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(var(--x), calc(var(--y) * 0.5)) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0.5);
          }
        }
      `}</style>
    </button>
  );
}
