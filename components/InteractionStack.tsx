'use client';

import {
  Settings,
  MessageCircle,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
} from 'lucide-react';

interface InteractionStackProps {
  onSettingsClick: () => void;
  onDMClick: () => void;
  onAvatarClick: () => void;
  onLikeClick: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onSaveClick: () => void;
  likeCount?: number;
  commentCount?: number;
  qtBlimpTime?: string;
}

export default function InteractionStack({
  onSettingsClick,
  onDMClick,
  onAvatarClick,
  onLikeClick,
  onCommentClick,
  onShareClick,
  onSaveClick,
  likeCount = 13,
  commentCount = 67,
  qtBlimpTime = '2:45',
}: InteractionStackProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-6">
      {/* Settings/Profile */}
      <button
        onClick={onSettingsClick}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Settings"
      >
        <Settings className="w-6 h-6 text-white" />
      </button>

      {/* DMs/Messages */}
      <button
        onClick={onDMClick}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Direct Messages"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Avatar with QT Blimp Timer */}
      <button
        onClick={onAvatarClick}
        className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
        aria-label="Profile"
      >
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-bold bg-black/80 rounded-full whitespace-nowrap">
          {qtBlimpTime}
        </div>
      </button>

      {/* Like */}
      <button
        onClick={onLikeClick}
        className="flex flex-col items-center space-y-1"
        aria-label="Like"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-medium text-white">
          {formatCount(likeCount)}+
        </span>
      </button>

      {/* Comment */}
      <button
        onClick={onCommentClick}
        className="flex flex-col items-center space-y-1"
        aria-label="Comment"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-medium text-white">
          {formatCount(commentCount)}+
        </span>
      </button>

      {/* Share */}
      <button
        onClick={onShareClick}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Share"
      >
        <Share2 className="w-6 h-6 text-white" />
      </button>

      {/* Save */}
      <button
        onClick={onSaveClick}
        className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        aria-label="Save"
      >
        <Bookmark className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
