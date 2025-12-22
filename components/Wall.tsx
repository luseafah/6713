'use client';

import { useEffect, useState, useRef } from 'react';
import { Heart, Send, Crown } from 'lucide-react';
import { WallMessage, Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';
import ComaModal from './ComaModal';
import TimeAgo from './TimeAgo';
import QuoteButton from './QuoteButton';

export default function Wall() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [quotedPhrase, setQuotedPhrase] = useState<{ phrase: string; username: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{ profile: Profile; username: string } | null>(null);
  const [replyingToComaUser, setReplyingToComaUser] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [glazeActive, setGlazeActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Fetch user profile to get verification and admin status
        const response = await fetch(`/api/profile?user_id=${user.id}`);
        const profile = await response.json();
        setIsVerified(profile.verified_at !== null);
        setIsAdmin(profile.is_admin || false);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUserId) {
      checkCooldown();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isAdmin) {
      loadOverrides();
      checkGlazeStatus();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (cooldown > 0) {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      
      cooldownIntervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [cooldown]);

  const checkGlazeStatus = async () => {
    try {
      const response = await fetch('/api/admin/glaze-protocol');
      const data = await response.json();
      setGlazeActive(data.enabled);
    } catch (error) {
      console.error('Failed to check glaze status:', error);
    }
  };

  const loadOverrides = async () => {
    try {
      const response = await fetch('/api/admin/override-stats');
      const data = await response.json();
      
      const overrideMap: Record<string, boolean> = {};
      (data.overrides || []).forEach((o: any) => {
        overrideMap[o.post_id] = true;
      });
      setOverrides(overrideMap);
    } catch (error) {
      console.error('Failed to load overrides:', error);
    }
  };

  const handleCrownClick = async (postId: string) => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/admin/override-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUserId,
          post_id: postId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOverrides(prev => ({
          ...prev,
          [postId]: data.overridden
        }));
        await loadMessages();
      }
    } catch (error) {
      console.error('Failed to toggle override:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/wall/messages?limit=50');
      const data = await response.json();
      
      if (data.messages) {
        // Fetch reaction counts for each message
        const messagesWithReactions = await Promise.all(
          data.messages.map(async (msg: WallMessage) => {
            const reactionResponse = await fetch(`/api/wall/reactions?message_id=${msg.id}`);
            const reactionData = await reactionResponse.json();
            return {
              ...msg,
              reaction_count: reactionData.count,
              display_count: reactionData.display_count,
            };
          })
        );
        setMessages(messagesWithReactions.reverse());
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const checkCooldown = async () => {
    try {
      const response = await fetch(`/api/wall/cooldown?user_id=${currentUserId}`);
      const data = await response.json();
      
      if (!data.canPost && data.remainingTime) {
        setCooldown(data.remainingTime);
      }
    } catch (error) {
      console.error('Failed to check cooldown:', error);
    }
  };

  const handleSendMessage = async () => {
    // Block posting for unverified users
    if (!isVerified) {
      return;
    }
    
    if (!newMessage.trim() || !isVerified || cooldown > 0 || loading) return;

    setLoading(true);

    try {
      // Prepare message content with quote if present
      let content = newMessage;
      if (quotedPhrase) {
        content = `"${quotedPhrase.phrase}" - @${quotedPhrase.username}\n\n${newMessage}`;
      }

      const response = await fetch('/api/wall/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          content: content,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setCooldown(data.cooldown || 7);
      } else if (response.ok) {
        setNewMessage('');
        setQuotedPhrase(null); // Clear quote after sending
        setCooldown(7);
        await loadMessages();
        scrollToBottom();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (messageId: string) => {
    try {
      await fetch('/api/wall/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          user_id: currentUserId,
        }),
      });

      await loadMessages();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleUsernameClick = async (userId: string, username: string) => {
    // Block profile viewing for unverified users
    if (!isVerified) {
      return; // Silently ignore clicks
    }
    
    try {
      const response = await fetch(`/api/coma/status?user_id=${userId}`);
      const data = await response.json();
      
      // Fetch full profile
      const profileResponse = await fetch(`/api/profile?user_id=${userId}`);
      const profileData = await profileResponse.json();
      
      setSelectedProfile({ profile: profileData, username });
      
      // Check if user is in COMA
      if (profileData.coma_status) {
        setReplyingToComaUser(userId);
      } else {
        setReplyingToComaUser(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleBreakFourthWall = async () => {
    if (!replyingToComaUser || !newMessage.trim()) return;

    const confirm = window.confirm(
      'Breaking the 4th Wall costs 100 Talents. The COMA user can Accept (they get 100 Talents) or Reject (Talents go to the Company). Continue?'
    );

    if (!confirm) return;

    try {
      const response = await fetch('/api/dm/break-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coma_user_id: replyingToComaUser,
          requester_user_id: currentUserId,
          message_content: newMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('4th Wall Break request sent! The COMA user will decide whether to Accept or Reject.');
        setNewMessage('');
        setReplyingToComaUser(null);
      } else {
        alert(data.error || 'Failed to break 4th wall');
      }
    } catch (error) {
      console.error('Failed to break 4th wall:', error);
      alert('Failed to send request');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Messages Area - No bottom nav, uses pb-12 for text alignment */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-12 space-y-4">
        {messages.map((message) => {
          // Show nickname for ALL users (verified and unverified)
          // Full names only visible when clicking to view profile
          const displayName = message.profiles?.nickname || message.username;
          
          return (
          <div
            key={message.id}
            className={`${
              message.is_coma_whisper ? 'opacity-50 italic' : ''
            } ${
              message.is_pope_ai ? 'bg-red-900/20 border border-red-500/30 rounded p-2' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => !isVerified ? null : handleUsernameClick(message.user_id, message.username)}
                className={`font-bold ${
                  message.is_pope_ai ? 'text-red-400' : 'text-blue-400'
                } ${!isVerified ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
                disabled={!isVerified}
              >
                {displayName}
              </button>
              <TimeAgo 
                date={message.created_at} 
                className="text-white/40 text-sm"
              />
            </div>
            
            {/* Media Display */}
            {message.media_url && (
              <div className="mt-2 rounded-lg overflow-hidden max-w-md">
                {message.message_type === 'voice' ? (
                  <video
                    src={message.media_url}
                    controls
                    className="w-full h-auto"
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={message.media_url}
                    alt={message.content || 'Shared media'}
                    className="w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                )}
              </div>
            )}
            
            <p className="text-white mt-1">{message.content}</p>
            
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleReaction(message.id)}
                className="flex items-center gap-1 text-white/60 hover:text-red-400 transition-colors"
              >
                <Heart size={16} />
                <span className="text-sm">
                  {overrides[message.id] 
                    ? '13+' 
                    : (message.reaction_count ?? 0) > 13 
                      ? '13+' 
                      : message.reaction_count || 0}
                </span>
              </button>

              {/* Admin Crown Icon (Glaze Protocol) */}
              {isAdmin && glazeActive && (
                <button
                  onClick={() => handleCrownClick(message.id)}
                  className={`crown-pulse transition-opacity ${
                    overrides[message.id] ? 'text-yellow-400' : 'text-white/30'
                  }`}
                  title="Toggle 13+ Override"
                >
                  <Crown size={16} />
                </button>
              )}
            </div>
          </div>
        );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        {!isVerified ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-white/80 text-sm mb-2">
              👁️ Read-only mode: Complete verification to post and interact
            </p>
            <p className="text-white/50 text-xs">
              You can see the Wall, but cannot post or view profiles yet
            </p>
          </div>
        ) : replyingToComaUser ? (
          <div className="space-y-2">
            <p className="text-yellow-400 text-sm">
              Replying to a COMA user. You cannot send directly.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Your message..."
                disabled
                className="flex-1 bg-white/5 text-white border border-white/20 rounded px-4 py-2 opacity-50 cursor-not-allowed"
              />
              <button
                onClick={handleBreakFourthWall}
                disabled={!newMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:cursor-not-allowed"
              >
                Break 4th Wall (100 Talents)
              </button>
            </div>
            <button
              onClick={() => {
                setReplyingToComaUser(null);
                setNewMessage('');
              }}
              className="text-sm text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Quote Preview */}
            {quotedPhrase && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 flex items-start justify-between">
                <div>
                  <p className="text-purple-400 text-xs font-medium mb-1">Quoting</p>
                  <p className="text-white text-sm italic">&quot;{quotedPhrase.phrase}&quot; - @{quotedPhrase.username}</p>
                </div>
                <button
                  onClick={() => setQuotedPhrase(null)}
                  className="text-white/60 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Input Row */}
            <div className="flex gap-2">
              <QuoteButton
                currentUserId={currentUserId}
                isVerified={isVerified}
                onQuote={async (phrase, userId, username) => {
                  setQuotedPhrase({ phrase, username });
                }}
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={cooldown > 0 ? `Breathe... ${cooldown}s` : quotedPhrase ? "Add your comment..." : "What's on your mind?"}
                disabled={cooldown > 0 || loading}
                className="flex-1 bg-white/5 text-white border border-white/20 rounded px-4 py-2 focus:outline-none focus:border-white/40 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={cooldown > 0 || loading || !newMessage.trim()}
                className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                {cooldown > 0 ? `${cooldown}s` : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMA Modal */}
      <ComaModal
        isOpen={selectedProfile !== null}
        onClose={() => setSelectedProfile(null)}
        profile={selectedProfile?.profile || null}
        username={selectedProfile?.username || ''}
        currentUserId={currentUserId}
      />
    </div>
  );
}
