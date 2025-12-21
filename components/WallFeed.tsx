'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import TimeAgo from './TimeAgo';

interface WallMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  media_url: string | null;
  message_type: 'text' | 'picture' | 'voice' | 'system';
  created_at: string;
  is_pope_ai: boolean;
  is_coma_whisper: boolean;
}

export default function WallFeed() {
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('wall_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 bg-white/5 rounded-xl overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-white/10" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className="break-inside-avoid mb-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
        >
          {/* Media */}
          {message.media_url && (
            <div className="relative w-full aspect-auto">
              {message.message_type === 'voice' ? (
                // Video
                <video
                  src={message.media_url}
                  controls
                  className="w-full h-auto"
                  preload="metadata"
                />
              ) : (
                // Image
                <img
                  src={message.media_url}
                  alt={message.content || 'Shared media'}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Content Card */}
          <div className="p-4">
            {/* Username & Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-white text-sm">
                {message.username}
              </span>
              {message.is_pope_ai && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                  POPE AI
                </span>
              )}
              {message.is_coma_whisper && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                  COMA
                </span>
              )}
            </div>

            {/* Message Content */}
            {message.content && (
              <p className="text-white/80 text-sm mb-3 leading-relaxed">
                {message.content}
              </p>
            )}

            {/* Timestamp & Actions */}
            <div className="flex items-center justify-between text-white/40 text-xs">
              <TimeAgo date={message.created_at} />
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                  <Heart size={14} />
                </button>
                <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <MessageCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {messages.length === 0 && !loading && (
        <div className="col-span-full text-center text-white/40 py-12">
          No messages yet. Be the first to post!
        </div>
      )}
    </div>
  );
}
