'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  DollarSign,
  Sparkles,
  Circle,
  Ban,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import TimeAgo from '@/components/TimeAgo';

// =====================================================
// TYPES
// =====================================================

interface Thread {
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
  last_message_text?: string;
  last_message_at: string;
  unread_count: number;
  total_qt_seconds: number;
  is_pinned: boolean;
}

// =====================================================
// PULSE PAGE COMPONENT
// =====================================================

export default function PulsePage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Separate system threads from social threads
  const systemThreads = threads.filter((t) => t.is_system_thread);
  const socialThreads = threads.filter((t) => !t.is_system_thread);
  
  // =====================================================
  // LOAD DATA
  // =====================================================
  
  useEffect(() => {
    loadThreads();
    
    // Set up realtime subscription for new messages
    const subscription = supabase
      .channel('pulse_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadThreads();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadThreads = async () => {
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
      
      // Get thread list
      const { data: threadData } = await supabase.rpc('get_thread_list', {
        p_user_id: user.id,
      });
      
      if (threadData) {
        setThreads(threadData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading threads:', error);
      setLoading(false);
    }
  };
  
  // =====================================================
  // RENDER
  // =====================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading conversations...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-black to-black/95 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <MessageCircle size={28} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Pulse</h1>
        </div>
        <p className="text-white/60 text-sm mt-1">Human-first conversations</p>
      </div>
      
      {/* Thread List */}
      <div className="divide-y divide-white/5">
        {/* =====================================================
            FIXED PILLARS: $$$ & Pope AI
            ===================================================== */}
        {systemThreads.length > 0 && (
          <div className="bg-gradient-to-b from-white/5 to-transparent">
            {systemThreads.map((thread) => (
              <SystemThreadRow key={thread.thread_id} thread={thread} />
            ))}
          </div>
        )}
        
        {/* If no system threads exist, create them on first load */}
        {systemThreads.length === 0 && currentUser && (
          <div className="bg-gradient-to-b from-white/5 to-transparent">
            <button
              onClick={async () => {
                // Create $$$ thread
                await supabase.rpc('get_or_create_thread', {
                  p_user_id: currentUser.user_id,
                  p_system_account_type: 'banker',
                });
                // Create Pope AI thread
                await supabase.rpc('get_or_create_thread', {
                  p_user_id: currentUser.user_id,
                  p_system_account_type: 'pope_ai',
                });
                loadThreads();
              }}
              className="w-full p-4 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Initialize system chats ($$$, Pope AI)
            </button>
          </div>
        )}
        
        {/* =====================================================
            SOCIAL LIST: Your 67 Huemans (Nickname-First)
            ===================================================== */}
        {socialThreads.length > 0 ? (
          socialThreads.map((thread) => (
            <SocialThreadRow key={thread.thread_id} thread={thread} />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-white/40">No conversations yet</p>
            <p className="text-white/30 text-sm mt-2">
              Connect with humans on the Hue tab to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SYSTEM THREAD ROW ($$$ & Pope AI)
// =====================================================

function SystemThreadRow({ thread }: { thread: Thread }) {
  const router = useRouter();
  
  const accentColor = thread.system_accent_color || '#9333EA';
  const isBanker = thread.system_account_type === 'banker';
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/pulse/${thread.thread_id}`)}
      className="w-full p-4 hover:bg-white/5 transition-colors"
      style={{
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            background: `${accentColor}20`,
            border: `2px solid ${accentColor}`,
            color: accentColor,
          }}
        >
          {isBanker ? <DollarSign size={28} /> : <Sparkles size={28} />}
        </div>
        
        {/* Content */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-lg">{thread.system_display_name}</p>
            {thread.unread_count > 0 && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {thread.unread_count}
              </div>
            )}
          </div>
          {thread.last_message_text && (
            <p className="text-white/60 text-sm mt-1 truncate">
              {thread.last_message_text}
            </p>
          )}
          {thread.last_message_at && (
            <p className="text-white/40 text-xs mt-1">
              <TimeAgo date={thread.last_message_at} />
            </p>
          )}
        </div>
        
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </motion.button>
  );
}

// =====================================================
// SOCIAL THREAD ROW (Nickname-First)
// =====================================================

function SocialThreadRow({ thread }: { thread: Thread }) {
  const router = useRouter();
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/pulse/${thread.thread_id}`)}
      className="w-full p-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={thread.other_profile_photo || '/default-avatar.png'}
            alt={thread.other_nickname || 'User'}
            className={`w-14 h-14 rounded-full object-cover ${
              thread.other_is_coma ? 'grayscale' : ''
            }`}
          />
          
          {/* Status Indicator */}
          <div className="absolute -bottom-1 -right-1">
            {thread.other_is_coma ? (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
                <Ban size={12} className="text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-black" />
            )}
          </div>
          
          {/* Verified Badge */}
          {thread.other_is_verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black">
              <CheckCircle size={12} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            {/* Nickname (Bold, Primary Identifier) */}
            <p className="text-white font-bold text-lg">
              {thread.other_nickname || thread.other_username}
            </p>
            
            {/* Unread Badge */}
            {thread.unread_count > 0 && (
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {thread.unread_count}
              </div>
            )}
          </div>
          
          {/* Last Message Preview */}
          {thread.last_message_text && (
            <p className="text-white/60 text-sm mt-1 truncate">
              {thread.last_message_text}
            </p>
          )}
          
          {/* Timestamp & QT */}
          <div className="flex items-center gap-3 mt-1">
            {thread.last_message_at && (
              <p className="text-white/40 text-xs">
                <TimeAgo date={thread.last_message_at} />
              </p>
            )}
            {thread.total_qt_seconds > 0 && (
              <div className="flex items-center gap-1 text-purple-400 text-xs">
                <Clock size={12} />
                <span>{Math.floor(thread.total_qt_seconds / 60)}m QT</span>
              </div>
            )}
          </div>
        </div>
        
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </motion.button>
  );
}
