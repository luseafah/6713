'use client';

import { useEffect, useState, useRef } from 'react';
import { Mic, Send, X, Zap } from 'lucide-react';
import { WallMessage } from '@/types/database';
import { supabase } from '@/lib/supabase';
import TimeAgo from './TimeAgo';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useThrowTalent } from '@/hooks/useThrowTalent';
import VoiceWaveform from '@/components/VoiceWaveform';
import Username from '@/components/Username';
import ThrowTalentButton from '@/components/ThrowTalentButton';
import { getSlowmodeWarning, getExpiredReplyMessage } from '@/lib/popeAI';

const MAX_MESSAGES = 50;
const SLOWMODE_SECONDS = 7;
const SLOWMODE_SKIP_COST = 5; // Talent cost to skip slowmode

export default function WallChat() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [talentBalance, setTalentBalance] = useState(0);
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<WallMessage | null>(null);
  const [slowmodeCooldown, setSlowmodeCooldown] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [transientMessage, setTransientMessage] = useState<string>('');
  const [inputMuted, setInputMuted] = useState(false);
  const [usersWithActiveGigs, setUsersWithActiveGigs] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsInBuffer = useRef<Set<string>>(new Set());
  const purgedMediaUrls = useRef<string[]>(
  const { throwTalents, throwing: isThrowing } = useThrowTalent();[]);
  
  const voiceRecorder = useVoiceRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch current user and talent balance
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: userData } = await supabase
          .from('users')
          .select('username, talent_balance')
          .eq('id', user.id)
          .single();
        
        setCurrentUsername(userData?.username || 'Anonymous');
        setTalentBalance(userData?.talent_balance || 0);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch users with active Gigs for Yellow "+" indicator
  useEffect(() => {
    const fetchActiveGigUsers = async () => {
      const { data: gigs } = await supabase
        .from('gigs')
        .select('user_id')
        .eq('is_completed', false);
      
      if (gigs) {
        const userIds = new Set(gigs.map(g => g.user_id));
        setUsersWithActiveGigs(userIds);
      }
    };
    
    fetchActiveGigUsers();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveGigUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load initial 50 messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('wall_messages')
        .select('*')
        .eq('post_type', 'wall')
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const reversedMessages = (data || []).reverse();
      setMessages(reversedMessages);
      messageIdsInBuffer.current = new Set(reversedMessages.map(m => m.id));
      scrollToBottom();
    };

    loadMessages();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('wall-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wall_messages',
          filter: 'post_type=eq.wall'
        },
        (payload) => {
          const newMsg = payload.new as WallMessage;
          
          setMessages((prev) => {
            const updated = [...prev, newMsg];
            const trimmed = updated.slice(-MAX_MESSAGES);
            
            if (updated.length > MAX_MESSAGES) {
              const purged = updated.slice(0, updated.length - MAX_MESSAGES);
              purged.forEach(msg => {
                if (msg.media_url && (msg.message_type === 'voice' || msg.message_type === 'picture')) {
                  purgedMediaUrls.current.push(msg.media_url);
                  deleteMediaFromStorage(msg.media_url);
                }
              });
            }
            
            messageIdsInBuffer.current = new Set(trimmed.map(m => m.id));
            return trimmed;
          });
          
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Slowmode countdown
  useEffect(() => {
    if (slowmodeCooldown > 0) {
      const timer = setTimeout(() => {
        setSlowmodeCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [slowmodeCooldown]);

  const isMessageInBuffer = (messageId: string) => {
    return messageIdsInBuffer.current.has(messageId);
  };

  const deleteMediaFromStorage = async (mediaUrl: string) => {
    try {
      const urlParts = mediaUrl.split('/storage/v1/object/public/media/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('media')
        .remove([filePath]);
      
      if (error) {
        console.error('Failed to delete media:', error);
      } else {
        console.log('Deleted purged media:', filePath);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isPosting) return;
    
    // Check slowmode (unless bypassed)
    if (slowmodeCooldown > 0) {
      // Show muted input warning
      setInputMuted(true);
      setTransientMessage(getSlowmodeWarning());
      setTimeout(() => {
        setInputMuted(false);
        setTransientMessage('');
      }, 3000);
      return;
    }

    setIsPosting(true);

    try {
      const { error } = await supabase
        .from('wall_messages')
        .insert({
          user_id: currentUserId,
          username: currentUsername,
          content: newMessage.trim(),
          message_type: 'text',
          post_type: 'wall',
          reply_to_id: replyingTo?.id || null
        });

      if (error) throw error;

      setNewMessage('');
      setReplyingTo(null);
      setSlowmodeCooldown(SLOWMODE_SECONDS);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Skip slowmode for 5 Talents
  const handleSkipSlowmode = async () => {
    if (talentBalance < SLOWMODE_SKIP_COST) {
      setTransientMessage('⚠️ INSUFFICIENT TALENT. YOU NEED 5 TALENT TO SKIP SLOWMODE.');
      setTimeout(() => setTransientMessage(''), 3000);
      return;
    }

    try {
      // Deduct Talent
      const { error } = await supabase
        .from('users')
        .update({ talent_balance: talentBalance - SLOWMODE_SKIP_COST })
        .eq('id', currentUserId);

      if (error) throw error;

      // Reset slowmode
      setSlowmodeCooldown(0);
      setTalentBalance(prev => prev - SLOWMODE_SKIP_COST);
      setTransientMessage('⚡ SLOWMODE BYPASSED. FREQUENCY ACCELERATED.');
      setTimeout(() => setTransientMessage(''), 3000);
    } catch (error) {
      console.error('Failed to skip slowmode:', error);
      setTransientMessage('❌ BYPASS FAILED. TRY AGAIN.');
      setTimeout(() => setTransientMessage(''), 3000);
    }
  };

  const handlePushToTalkStart = async () => {
    if (slowmodeCooldown > 0 || isPosting) return;
    
    setIsPushToTalkActive(true);
    await voiceRecorder.startRecording();
  };

  const handlePushToTalkEnd = async () => {
    if (!isPushToTalkActive || !voiceRecorder.isRecording) return;
    
    setIsPushToTalkActive(false);
    setIsPosting(true);

    try {
      const audioBlob = await voiceRecorder.stopRecording();
      if (!audioBlob) throw new Error('No audio recorded');

      const voiceUrl = await voiceRecorder.uploadVoiceMessage(audioBlob);

      const { error } = await supabase
        .from('wall_messages')
        .insert({
          user_id: currentUserId,
          username: currentUsername,
          content: `Voice message (${voiceRecorder.duration}s)`,
          media_url: voiceUrl,
          message_type: 'voice',
          post_type: 'wall',
          reply_to_id: replyingTo?.id || null
        });

      if (error) throw error;

      setReplyingTo(null);
      setSlowmodeCooldown(SLOWMODE_SECONDS);
    } catch (error) {
      console.error('Failed to send voice:', error);
      alert('Failed to send voice message.');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePushToTalkCancel = () => {
    if (isPushToTalkActive) {
      setIsPushToTalkActive(false);
      voiceRecorder.cancelRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-white/10 p-4">
        <h1 className="text-2xl font-bold text-white">#Earth</h1>
        <p className="text-white/40 text-xs">High-velocity chat · Last {MAX_MESSAGES} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Transient Pope AI Message */}
        {transientMessage && (
          <div className="flex justify-center mb-4 animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-500/20 via-white/10 to-yellow-500/20 border border-yellow-500/30 rounded-lg px-6 py-3 max-w-lg">
              <p className="text-center text-yellow-200 text-sm font-semibold">
                ⚡ POPE AI ⚡
              </p>
              <p className="text-center text-white text-sm mt-1">
                {transientMessage}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          // Pope AI messages get special treatment
          const isPopeAI = message.is_pope_ai || message.message_type === 'system';
          
          if (isPopeAI) {
            return (
              <div key={message.id} className="flex justify-center my-6">
                <div className="bg-gradient-to-r from-yellow-500/20 via-white/10 to-yellow-500/20 border-2 border-yellow-500/50 rounded-xl px-8 py-4 max-w-2xl shadow-lg shadow-yellow-500/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-yellow-400 text-xs font-bold tracking-wider">
                      ⚡ POPE AI ORACLE ⚡
                    </span>
                    <TimeAgo date={message.created_at} className="text-white/40 text-xs" />
                  </div>
                  <p className="text-center text-white font-medium text-base leading-relaxed">
                    {message.content}
                  </p>
                  {message.is_permanent && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="text-yellow-400/60 text-xs">
                        ∞ PERMANENT RECORD
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Regular user messages
          return (
            <div
              key={message.id}
              className="group"
            >
              {/* Username & Timestamp */}
              <div className="flex items-center gap-2 mb-1">
              <Username 
                username={message.username}
                userId={message.user_id}
                hasActiveGig={usersWithActiveGigs.has(message.user_id)}
                className={`font-bold text-sm ${
                  message.is_pope_ai ? 'text-red-400' : 'text-blue-400'
                }`}
              />
              {message.is_pope_ai && (
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                  POPE AI
                </span>
              )}
              <TimeAgo date={message.created_at} className="text-white/40 text-xs" />
            </div>

            {/* Reply indicator with Pope AI intervention */}
            {replyingTo && replyingTo.id === message.id && (
              <div className="text-xs text-purple-400 mb-1">
                {isMessageInBuffer(replyingTo.id)
                  ? `Replying to: "${replyingTo.content.substring(0, 50)}..."`
                  : getExpiredReplyMessage(replyingTo.username)}
              </div>
            )}

            {/* Voice Message */}
            {message.message_type === 'voice' && message.media_url && (
              <div className="bg-white/5 rounded-lg p-3 mb-2">
                <VoiceWaveform 
                  audioUrl={message.media_url}
                  duration={message.content}
                />
              </div>
            )}

            {/* Image */}
            {message.message_type === 'picture' && message.media_url && (
              <div className="mb-2">
                <img
                  src={message.media_url}
                  alt="Shared image"
                  className="max-w-xs rounded-lg"
                  loading="lazy"
                />
              </div>
            )}

            {/* Text Content */}
            <p className="text-white text-sm">{message.content}</p>
3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    if (!isMessageInBuffer(message.id)) {
                      // Show transient Pope AI warning
                      setTransientMessage(getExpiredReplyMessage(message.username));
                      setTimeout(() => setTransientMessage(''), 4000);
                    } else {
                      setReplyingTo(message);
                    }
                  }}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  Reply
                </button>
                
                {/* Throw Talent Button */}
                {currentUserId && message.user_id !== currentUserId && (
                  <ThrowTalentButton
                    compact
                    disabled={isThrowing}
                    onThrow={async (amount) => {
                      const result = await throwTalents(
                        currentUserId,
                        message.user_id,
                        amount
                      );
                      
                      if (result.success) {
                        setTalentBalance(result.newSenderBalance || talentBalance);
                      } else {
                        alert(result.error || 'Failed to throw Talents');
                      }
                    }}
                  />
                )}me="text-xs text-white/40 hover:text-white/60"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Bar */}
      {replyingTo && (
        <div className="bg-white/5 border-t border-white/10 px-4 py-2 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-white/60">Replying to @{replyingTo.username}</p>
            <p className="text-xs text-white/40 truncate">
              {isMessageInBuffer(replyingTo.id)
                ? replyingTo.content
                : `Ask @${replyingTo.username} (message out of buffer)`}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        {/* Push-to-Talk Recording Indicator */}
        {isPushToTalkActive && voiceRecorder.isRecording && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-mono">
                  {formatDuration(voiceRecorder.duration)}
                </span>
                <span className="text-white/60 text-sm">
                  {voiceRecorder.duration >= voiceRecorder.maxDuration 
                    ? '⏱️ Max duration reached' 
                    : 'Hold to record, release to send'}
                </span>
              </div>
              <span className="text-white/40 text-xs">
                {voiceRecorder.maxDuration - voiceRecorder.duration}s left
              </span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  voiceRecorder.duration >= voiceRecorder.maxDuration 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min((voiceRecorder.duration / voiceRecorder.maxDuration) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={inputMuted ? "⏱️ Input muted..." : "Message #Earth..."}
              className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 ${
                inputMuted 
                  ? 'border-red-500/50 bg-red-900/10 cursor-not-allowed' 
                  : 'border-white/10 focus:ring-white/20'
              }`}
              rows={2}
              disabled={isPushToTalkActive || isPosting || inputMuted}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Push-to-Talk Voice Button */}
            <button
              onMouseDown={handlePushToTalkStart}
              onMouseUp={handlePushToTalkEnd}
              onMouseLeave={handlePushToTalkCancel}
              onTouchStart={handlePushToTalkStart}
              onTouchEnd={handlePushToTalkEnd}
              disabled={slowmodeCooldown > 0 || isPosting}
              className={`p-3 rounded-lg transition-all disabled:opacity-50 select-none ${
                isPushToTalkActive
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              title="Hold to record voice message"
            >
              <Mic size={20} className={isPushToTalkActive ? 'text-white' : 'text-white/60'} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isPosting || isPushToTalkActive || inputMuted}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 relative"
            >
              {slowmodeCooldown > 0 ? (
                <span className="text-white/60 text-xs font-mono">{slowmodeCooldown}s</span>
              ) : (
                <Send size={20} className="text-white/60" />
              )}
            </button>
          </div>
        </div>

        {/* Slowmode Info with Bypass Option */}
        <div className="flex items-center justify-between mt-2">
          {slowmodeCooldown > 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-white/40">
                Slowmode: Wait {slowmodeCooldown}s before sending again
              </p>
              {talentBalance >= SLOWMODE_SKIP_COST && (
                <button
                  onClick={handleSkipSlowmode}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-yellow-300 text-xs font-semibold transition-colors"
                >
                  <Zap size={12} />
                  Skip for 5 Talent
                </button>
              )}
            </div>
          ) : !isPushToTalkActive ? (
            <p className="text-xs text-white/30">
              💡 Hold mic button to record voice message
            </p>
          ) : null}

          {talentBalance > 0 && (
            <div className="text-xs text-yellow-400 font-mono">
              ⚡ {talentBalance} Talent
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
