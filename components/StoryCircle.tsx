'use client';

import { WallMessage } from '@/types/database';

interface StoryCircleProps {
  story: WallMessage;
  isLive?: boolean;
  hasActiveBudgeGig?: boolean;
  liveStreamDuration?: number; // in seconds
  onClick?: () => void;
}

export default function StoryCircle({ 
  story, 
  isLive = false, 
  hasActiveBudgeGig = false,
  liveStreamDuration,
  onClick 
}: StoryCircleProps) {
  
  // Format live stream duration badge (1m, 5m, 1hr, 30hr, 1D, 30D)
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}hr`;
    const days = Math.floor(hours / 24);
    return `${days}D`;
  };

  // Scenario A: Active Live Stream
  // Badge: Display duration | Border: Yellow/Red flicker if Budge, else Pulsing Red
  
  // Scenario B: Static Gig (Not Live)  
  // Badge: None | Border: Yellow/Red flicker if Budge

  const showDurationBadge = isLive && liveStreamDuration !== undefined;
  
  // Determine border style based on state
  const getBorderStyle = () => {
    if (isLive && hasActiveBudgeGig) {
      return 'flicker-border'; // Live + Budge = Yellow/Red flicker
    } else if (isLive) {
      return 'live-border'; // Live only = Pulsing red
    } else if (hasActiveBudgeGig) {
      return 'flicker-border'; // Static Gig with Budge = Yellow/Red flicker
    } else {
      return 'ring-2 ring-white/30'; // Standard story
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-2 group"
    >
      {/* Circle Container */}
      <div className="relative">
        {/* Story Circle with Conditional Border */}
        <div className={`
          relative w-20 h-20 rounded-full overflow-hidden
          ${getBorderStyle()}
          transition-all duration-300
          group-hover:scale-110
        `}>
          {/* Background Gradient if no media */}
          {!story.media_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600" />
          )}
          
          {/* Media Preview */}
          {story.media_url && (
            <>
              {story.message_type === 'voice' ? (
                // Video thumbnail
                <video
                  src={story.media_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                // Image
                <img
                  src={story.media_url}
                  alt={story.username}
                  className="w-full h-full object-cover"
                />
              )}
            </>
          )}
          
          {/* Username Initial Overlay (if no media) */}
          {!story.media_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-3xl font-bold uppercase">
                {story.username.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Duration Badge - Only for Live Streams */}
        {showDurationBadge && (
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            {formatDuration(liveStreamDuration!)}
          </div>
        )}
      </div>

      {/* Username */}
      <span className="text-white/80 text-xs font-medium max-w-[80px] truncate">
        {story.username}
      </span>
    </button>
  );
}
