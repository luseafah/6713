'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  Slash,
  DollarSign,
  Sparkles,
  Crown,
  Ban,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import TimeAgo from '@/components/TimeAgo';

// =====================================================
// TYPES
// =====================================================

interface Message {
  message_id: string;
  sender_id?: string;
  sender_username?: string;
  sender_nickname?: string;
  sender_profile_photo?: string;
  is_system_message: boolean;
  message_text?: string;
  media_url?: string;
  media_type?: string;
  media_thumbnail?: string;
  post_id?: string;
  created_at: string;
  is_slashed: boolean;
  slashed_by_username?: string;
  is_talent_injection: boolean;
  talent_injection_amount?: number;
}

interface ThreadInfo {
  thread_id: string;
  is_system_thread: boolean;
  system_display_name?: string;
  system_account_type?: string;
  system_accent_color?: string;
  other_user_id?: string;
  other_username?: string;
  other_nickname?: string;
  other_profile_photo?: string;
  other_is_coma?: boolean;
  other_is_verified?: boolean;
}

// =====================================================
// CHAT THREAD COMPONENT
// =====================================================

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadId = params.threadId as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threadInfo, setThreadInfo] = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // QT Tracking
  const [qtId, setQtId] = useState<string | null>(null);
  const [dwellSeconds, setDwellSeconds] = useState(0);
  
  // Admin
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [talentAmount, setTalentAmount] = useState('');
  
  const isSystemThread = threadInfo?.is_system_thread;
  const isBankerThread = threadInfo?.system_account_type === 'banker';
  const isPopeAI = threadInfo?.system_account_type === 'pope_ai';
  const isAdmin = currentUser?.is_admin || currentUser?.is_mod;
  
  // =====================================================
  // LOAD DATA
  // =====================================================
  
  useEffect(() => {
    loadThread();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel(`thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
      endQTSession();
    };
  }, [threadId]);
  
  useEffect(() => {
    if (!threadInfo) return;
    
    // Start QT tracking
    startQTSession();
    
    // Update QT every second
    const interval = setInterval(() => {
      setDwellSeconds((prev) => prev + 1);
      if (qtId) {
        supabase.rpc('update_conversation_qt', {
          p_qt_id: qtId,
          p_additional_seconds: 1,
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [threadInfo, qtId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const loadThread = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setCurrentUser(userData);
      
      // Get thread info from thread list
      const { data: threads } = await supabase.rpc('get_thread_list', {
        p_user_id: user.id,
      });
      
      const thread = threads?.find((t: any) => t.thread_id === threadId);
      if (thread) {
        setThreadInfo(thread);
      }
      
      // Load messages
      await loadMessages();
      
      // Mark messages as read
      await supabase.rpc('mark_messages_read', {
        p_thread_id: threadId,
        p_user_id: user.id,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading thread:', error);
      setLoading(false);
    }
  };
  
  const loadMessages = async () => {
    const { data } = await supabase.rpc('get_thread_messages', {
      p_thread_id: threadId,
      p_limit: 100,
      p_offset: 0,
    });
    
    if (data) {
      setMessages(data.reverse()); // Reverse to show oldest first
    }
  };
  
  const startQTSession = async () => {
    const { data } = await supabase.rpc('start_conversation_qt', {
      p_thread_id: threadId,
      p_user_id: currentUser.user_id,
    });
    
    if (data) setQtId(data);
  };
  
  const endQTSession = async () => {
    if (!qtId) return;
    
    await supabase.rpc('end_conversation_qt', {
      p_qt_id: qtId,
    });
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // =====================================================
  // ACTIONS
  // =====================================================
  
  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    
    try {
      // Send message
      await supabase.rpc('send_message', {
        p_thread_id: threadId,
        p_sender_id: currentUser.user_id,
        p_message_text: messageText,
      });
      
      // If Pope AI, trigger auto-response
      if (isPopeAI) {
        await supabase.rpc('pope_ai_respond', {
          p_user_id: currentUser.user_id,
          p_user_message: messageText,
        });
      }
      
      setMessageText('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  const handleAdminSlash = async (messageId: string) => {
    const reason = prompt('Slash reason (optional):');
    
    const { data } = await supabase.rpc('admin_slash_message', {
      p_admin_user_id: currentUser.user_id,
      p_message_id: messageId,
    });
    
    if (data?.success) {
      loadMessages();
    }
  };
  
  const handleTalentInjection = async () => {
    if (!talentAmount || !threadInfo?.other_user_id) return;
    
    const amount = parseInt(talentAmount);
    if (isNaN(amount)) {
      alert('Invalid amount');
      return;
    }
    
    const reason = prompt('Reason for injection (optional):');
    
    const { data } = await supabase.rpc('banker_inject_talents', {
      p_admin_user_id: currentUser.user_id,
      p_recipient_user_id: threadInfo.other_user_id,
      p_talent_amount: amount,
      p_reason: reason,
    });
    
    if (data?.success) {
      alert(`Injected ${amount} Talents. New balance: ${data.new_balance}`);
      setTalentAmount('');
      setShowAdminPanel(false);
      loadMessages();
    } else {
      alert(data?.error || 'Failed to inject talents');
    }
  };
  
  // =====================================================
  // RENDER
  // =====================================================
  
  if (loading || !threadInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading conversation...</div>
      </div>
    );
  }
  
  const displayName = isSystemThread
    ? threadInfo.system_display_name
    : threadInfo.other_nickname || threadInfo.other_username;
  
  const accentColor = threadInfo.system_accent_color || '#9333EA';
  
  return (
    <div className="min-h-screen bg-black flex flex-col pb-20">
      {/* =====================================================
          HEADER (Nickname-Centered + QT Blimp)
          ===================================================== */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md border-b p-4"
        style={{
          background: isSystemThread
            ? `linear-gradient(to bottom, ${accentColor}20, transparent)`
            : 'linear-gradient(to bottom, rgba(0,0,0,0.95), transparent)',
          borderColor: isSystemThread ? `${accentColor}40` : 'rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={24} className="text-white" />
          </button>
          
          {/* Avatar/Icon */}
          <div className="relative">
            {isSystemThread ? (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{
                  background: `${accentColor}30`,
                  border: `2px solid ${accentColor}`,
                }}
              >
                {isBankerThread ? (
                  <DollarSign size={24} style={{ color: accentColor }} />
                ) : (
                  <Sparkles size={24} style={{ color: accentColor }} />
                )}
              </div>
            ) : (
              <>
                <img
                  src={threadInfo.other_profile_photo || '/default-avatar.png'}
                  alt={displayName}
                  className={`w-12 h-12 rounded-full object-cover ${
                    threadInfo.other_is_coma ? 'grayscale' : ''
                  }`}
                />
                {threadInfo.other_is_coma && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
                    <Ban size={12} className="text-white" />
                  </div>
                )}
                {threadInfo.other_is_verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Name (Centered, Bold) */}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            {!isSystemThread && threadInfo.other_username && (
              <p className="text-white/60 text-sm">@{threadInfo.other_username}</p>
            )}
          </div>
          
          {/* QT Blimp */}
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full">
            <Clock size={14} className="text-purple-400" />
            <span className="text-white text-sm font-medium">{Math.floor(dwellSeconds / 60)}:{(dwellSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
          
          {/* Admin Crown ($$$ thread only) */}
          {isAdmin && isBankerThread && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg"
            >
              <Crown size={20} className="text-yellow-400" />
            </button>
          )}
        </div>
        
        {/* Admin Talent Injection Panel */}
        <AnimatePresence>
          {showAdminPanel && isBankerThread && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg overflow-hidden"
            >
              <p className="text-yellow-400 text-sm font-bold mb-2">💰 Manual Talent Injection</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={talentAmount}
                  onChange={(e) => setTalentAmount(e.target.value)}
                  placeholder="Amount (+ or -)"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-500/50"
                />
                <button
                  onClick={handleTalentInjection}
                  disabled={!talentAmount}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Inject
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* =====================================================
          MESSAGES (Pretty Links + Slashed Messages)
          ===================================================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.message_id}
            message={message}
            isOwn={message.sender_id === currentUser?.user_id}
            isAdmin={isAdmin}
            onSlash={handleAdminSlash}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* =====================================================
          INPUT BAR
          ===================================================== */}
      <div className="sticky bottom-0 border-t border-white/10 bg-black/95 backdrop-blur-md p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isPopeAI
                ? 'Ask about 6713 rules, CPR, or Talents...'
                : isBankerThread
                ? 'Request manual Talent top-up...'
                : 'Type a message...'
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MESSAGE BUBBLE COMPONENT
// =====================================================

function MessageBubble({
  message,
  isOwn,
  isAdmin,
  onSlash,
}: {
  message: Message;
  isOwn: boolean;
  isAdmin: boolean;
  onSlash: (messageId: string) => void;
}) {
  const router = useRouter();
  
  // System messages (Pope AI responses, talent injections)
  if (message.is_system_message) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
          {message.is_talent_injection && (
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-green-400 font-bold">
                {message.talent_injection_amount! > 0 ? '+' : ''}
                {message.talent_injection_amount} Talents
              </span>
            </div>
          )}
          <p className="text-white/90 text-sm">{message.message_text}</p>
          <p className="text-white/40 text-xs mt-2">
            <TimeAgo date={message.created_at} />
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Sender Name (if not own) */}
        {!isOwn && (
          <p className="text-white/60 text-xs px-3">
            {message.sender_nickname || message.sender_username}
          </p>
        )}
        
        {/* Message Content */}
        <div className="relative group">
          <div
            className={`rounded-2xl p-3 ${
              isOwn
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white'
            } ${message.is_slashed ? 'opacity-60' : ''}`}
          >
            {/* Pretty Link (Media) */}
            {message.media_url && (
              <button
                onClick={() => {
                  if (message.post_id) {
                    router.push(`/hue?post=${message.post_id}`);
                  }
                }}
                className="mb-2 overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
              >
                <img
                  src={message.media_thumbnail || message.media_url}
                  alt="Shared media"
                  className="w-full aspect-video object-cover"
                />
                <div className="mt-1 flex items-center gap-1 text-purple-300 text-xs">
                  {message.media_type === 'video' && <Video size={12} />}
                  {message.media_type === 'photo' && <ImageIcon size={12} />}
                  <span>Tap to view in Hue</span>
                </div>
              </button>
            )}
            
            {/* Text Message */}
            {message.message_text && (
              <p className={message.is_slashed ? 'line-through' : ''}>
                {message.message_text}
              </p>
            )}
            
            {/* Slashed Indicator */}
            {message.is_slashed && (
              <p className="text-xs text-red-300 mt-1">
                ~~Slashed by {message.slashed_by_username}~~
              </p>
            )}
          </div>
          
          {/* Admin Slash Button */}
          {isAdmin && !isOwn && !message.is_slashed && (
            <button
              onClick={() => onSlash(message.message_id)}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Slash size={14} className="text-white" />
            </button>
          )}
        </div>
        
        {/* Timestamp */}
        <p className="text-white/40 text-xs px-3">
          <TimeAgo date={message.created_at} />
        </p>
      </div>
    </div>
  );
}
