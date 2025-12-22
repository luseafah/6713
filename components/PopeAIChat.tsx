'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Shield } from 'lucide-react';
import { DMMessage } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface PopeAIChatProps {
  isLocked?: boolean; // Self-Kill lockout
  onVerifyUser?: (targetUserId: string) => void;
  onPromoteUser?: (targetUserId: string) => void;
}

export default function PopeAIChat({ 
  isLocked = false,
  onVerifyUser,
  onPromoteUser 
}: PopeAIChatProps) {
  const [userId, setUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Check admin status
        const response = await fetch(`/api/profile?user_id=${user.id}`);
        const profile = await response.json();
        setIsAdmin(profile.is_admin || false);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadThread();
      
      // Real-time updates every 3 seconds
      const interval = setInterval(loadThread, 3000);
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel('pope-ai-chat')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'dm_messages',
          filter: threadId ? `thread_id=eq.${threadId}` : undefined,
        }, () => {
          loadThread();
        })
        .subscribe();
      
      return () => {
        clearInterval(interval);
        channel.unsubscribe();
      };
    }
  }, [userId, threadId]);

  const loadThread = async () => {
    try {
      const response = await fetch(`/api/dm/pope-ai?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setThreadId(data.thread.id);
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load Pope AI thread:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/dm/pope-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadThread();
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 p-4 flex items-center gap-3">
        <div className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold">Pope AI</h2>
          <p className="text-white/60 text-sm">Support & Administration</p>
        </div>
      </div>

      {/* Self-Kill Warning */}
      {isLocked && (
        <div className="bg-red-900/20 border-b border-red-500/30 p-4">
          <p className="text-red-400 text-sm font-medium">
            ⚠️ Self-Kill Active: 72-hour lockout. Only Pope AI messaging available.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/40 py-8">
            <p>Welcome to Pope AI Support</p>
            <p className="text-sm mt-2">Send a message to begin</p>
          </div>
        )}

        {messages.map((message) => {
          const isPopeAI = message.sender_id === 'pope-ai';
          const isWhisper = message.is_whisper;

          return (
            <div
              key={message.id}
              className={`flex ${isPopeAI ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isPopeAI
                    ? 'bg-red-900/20 border border-red-500/30'
                    : isWhisper
                    ? 'bg-white/5 border border-white/10 opacity-50 italic'
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                <p className="text-white text-sm">{message.content}</p>
                {isWhisper && !message.fourth_wall_broken && (
                  <p className="text-white/40 text-xs mt-1">
                    One-way whisper (COMA mode)
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="border-t border-purple-500/30 bg-purple-900/10 p-4">
          <p className="text-purple-400 text-sm font-bold mb-2">ADMIN ACTIONS:</p>
          <div className="flex gap-2">
            <button
              onClick={() => onVerifyUser && onVerifyUser('target-user-id')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              VERIFY USER
            </button>
            <button
              onClick={() => onPromoteUser && onPromoteUser('target-user-id')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              MAKE ADMIN
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Message Pope AI..."
            disabled={loading}
            className="flex-1 bg-white/5 text-white border border-white/20 rounded px-4 py-2 focus:outline-none focus:border-white/40 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
