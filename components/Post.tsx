'use client';

import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';

interface PostProps {
  id: string;
  username: string;
  isVerified: boolean;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export default function Post({
  id,
  username,
  isVerified,
  content,
  mediaUrl,
  likeCount,
  commentCount,
  isLiked,
  isSaved,
  createdAt,
  onLike,
  onComment,
  onShare,
  onSave,
}: PostProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatDate = (date: string): string => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return postDate.toLocaleDateString();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {username[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white">{username}</span>
            {isVerified && (
              <span className="text-blue-400 text-sm">✓</span>
            )}
          </div>
          <p className="text-xs text-white/60">{formatDate(createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-white mb-4">{content}</p>

      {/* Media */}
      {mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img
            src={mediaUrl}
            alt="Post media"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <button
          onClick={onLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            isLiked
              ? 'text-red-400 bg-red-400/10'
              : 'text-white/60 hover:bg-white/5'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{formatCount(likeCount)}</span>
        </button>

        <button
          onClick={onComment}
          className="flex items-center space-x-2 px-3 py-2 text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium">{formatCount(commentCount)}</span>
        </button>

        <button
          onClick={onShare}
          className="flex items-center space-x-2 px-3 py-2 text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          onClick={onSave}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            isSaved
              ? 'text-purple-400 bg-purple-400/10'
              : 'text-white/60 hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
