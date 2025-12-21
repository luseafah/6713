'use client';

import { Settings, MessageCircle, User, Heart, MessageSquare, Share2, Bookmark, Reply, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { MediaType, canLike, canComment, formatCommentCount, formatLikeCount, getInteractionNotice } from '@/lib/interactionProtocol';

interface InteractionStackProps {
  userId: string;
  avatarUrl?: string;
  timerText?: string;
  onSettingsClick?: () => void;
  onMessagesClick?: () => void;
  onProfileClick?: () => void;
}

export default function InteractionStack({
  userId,
  avatarUrl,
  timerText = '0h',
  onSettingsClick,
  onMessagesClick,
  onProfileClick,
}: InteractionStackProps) {
  return (
    <div className="fixed right-4 top-20 z-40 flex flex-col gap-4">
      {/* Settings/COMA Toggle */}
      <button
        onClick={onSettingsClick}
        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>

      {/* Messages/DMs */}
      <button
        onClick={onMessagesClick}
        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm relative"
        aria-label="Messages"
      >
        <MessageCircle size={24} />
        {/* Optional notification badge */}
        {/* <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full" /> */}
      </button>

      {/* Avatar with QT Blimp (Timer) */}
      <button
        onClick={onProfileClick}
        className="relative"
        aria-label="Profile"
      >
        <div className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        {/* QT Blimp Timer Bubble */}
        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {timerText}
        </div>
      </button>
    </div>
  );
}

interface PostInteractionProps {
  postId: string;
  mediaType: MediaType; // Protocol: Determines allowed interactions
  likeCount: number;
  commentCount: number;
  userLiked: boolean;
  adminRiggedStats?: boolean;
  onLike: () => void;
  onComment: () => void;
  onReply: () => void; // NEW: Reply action for media posts
  onTalentThrow: () => void; // NEW: Talent Throw action
  onShare: () => void;
  onSave: () => void;
}

export function PostInteraction({
  postId,
  mediaType,
  likeCount,
  commentCount,
  userLiked,
  adminRiggedStats = false,
  onLike,
  onComment,
  onReply,
  onTalentThrow,
  onShare,
  onSave,
}: PostInteractionProps) {
  // Protocol: Cap display at ceiling limits
  const displayLikeCount = adminRiggedStats || likeCount > 13 ? '13+' : formatLikeCount(likeCount);
  const displayCommentCount = formatCommentCount(commentCount);
  
  // Protocol: Check if standard interactions are allowed
  const showLike = canLike(mediaType);
  const showComment = canComment(mediaType);
  const isMediaPost = ['voice', 'image', 'video'].includes(mediaType);

  return (
    <div className="flex flex-col gap-4">
      {/* Protocol: Like (Only for Text Posts) */}
      {showLike && (
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            userLiked ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'
          }`}>
            <Heart
              size={20}
              className={userLiked ? 'fill-white text-white' : 'text-white'}
            />
          </div>
          <span className="text-white text-xs">{displayLikeCount}</span>
        </button>
      )}

      {/* Protocol: Reply (Primary Interaction for Media) */}
      <button
        onClick={isMediaPost ? onReply : onComment}
        className="flex flex-col items-center gap-1"
        title={isMediaPost ? "Reply to this post" : "View comments"}
      >
        <div className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
          {isMediaPost ? (
            <Reply size={20} className="text-white" />
          ) : (
            <MessageSquare size={20} className="text-white" />
          )}
        </div>
        <span className="text-white text-xs">{displayCommentCount}</span>
      </button>

      {/* Protocol: Talent Throw (Always Available) */}
      <button
        onClick={onTalentThrow}
        className="flex flex-col items-center gap-1 group"
        title="Throw Talents"
      >
        <div className="bg-white/10 hover:bg-yellow-500/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-yellow-500/30">
          <DollarSign size={20} className="text-yellow-500" />
        </div>
        <span className="text-yellow-500 text-xs font-bold">T</span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1"
      >
        <div className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
          <Share2 size={20} className="text-white" />
        </div>
      </button>

      {/* Save */}
      <button
        onClick={onSave}
        className="flex flex-col items-center gap-1"
      >
        <div className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
          <Bookmark size={20} className="text-white" />
        </div>
      </button>
    </div>
  );
}
