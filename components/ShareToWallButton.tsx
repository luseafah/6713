'use client';

import { useState } from 'react';
import { Share2, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ShareToWallButtonProps {
  postId: string;
  isVerified: boolean;
  className?: string;
}

export default function ShareToWallButton({ 
  postId, 
  isVerified,
  className = '' 
}: ShareToWallButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleLongPress = () => {
    if (!isVerified) {
      alert('Only verified users can share to Wall');
      return;
    }
    
    setShowMessage(true);
  };

  const handleShare = async () => {
    if (!isVerified) return;

    setIsSharing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('share_post_to_wall', {
        p_sharer_user_id: user.id,
        p_original_post_id: postId,
        p_share_message: shareMessage.trim() || null
      });

      if (error) throw error;

      if (data?.success) {
        setIsShared(true);
        setShowMessage(false);
        setShareMessage('');
        
        // Reset after 3 seconds
        setTimeout(() => {
          setIsShared(false);
        }, 3000);
      } else {
        throw new Error(data?.error || 'Failed to share');
      }
    } catch (error: any) {
      console.error('Error sharing to Wall:', error);
      alert(error.message || 'Failed to share to Wall');
    } finally {
      setIsSharing(false);
    }
  };

  if (showMessage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
          <h3 className="text-white font-bold text-lg mb-4">Share to Wall</h3>
          
          <textarea
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Add a message (optional)..."
            className="w-full bg-zinc-800 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
            rows={3}
            autoFocus
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowMessage(false);
                setShareMessage('');
              }}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onMouseDown={handleLongPress}
      onTouchStart={handleLongPress}
      disabled={!isVerified || isSharing || isShared}
      className={`relative ${className}`}
      aria-label="Long press to share to Wall"
      title={isVerified ? "Long press to share to Wall" : "Only verified users can share"}
    >
      {isShared ? (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Shared!</span>
        </div>
      ) : (
        <Share2 className={`w-5 h-5 ${isVerified ? 'text-white/60 hover:text-white' : 'text-white/20'}`} />
      )}
    </button>
  );
}
