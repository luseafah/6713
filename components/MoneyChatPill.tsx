'use client';

import { useEffect, useState, useRef } from 'react';
import { DollarSign, X, Send, Mic, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import VoiceWaveform from '@/components/VoiceWaveform';
import TimeAgo from '@/components/TimeAgo';

interface MoneyChatMessage {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message_type: 'text' | 'image' | 'voice';
  content?: string;
  media_url?: string;
  is_payment_proof: boolean;
  is_strikethrough: boolean;
  created_at: string;
}

interface MoneyChatPillProps {
  onClose?: () => void;
}

export default function MoneyChatPill({ onClose }: MoneyChatPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [messages, setMessages] = useState<MoneyChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [talentBalance, setTalentBalance] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorder = useVoiceRecorder();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadMessages();
      subscribeToMessages();
      loadMetadata();
    }
  }, [currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Get talent balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('talent_balance')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setTalentBalance(profile.talent_balance);
      }
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('money_chat_messages')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading money chat:', error);
      return;
    }

    setMessages(data || []);
  };

  const loadMetadata = async () => {
    const { data } = await supabase
      .from('money_chat_metadata')
      .select('unread_count')
      .eq('user_id', currentUserId)
      .single();

    if (data) {
      setUnreadCount(data.unread_count);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`money-chat-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'money_chat_messages',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          const newMsg = payload.new as MoneyChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          // If it's from admin, mark as unread
          if (newMsg.sender_type === 'admin') {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleOpen = async () => {
    setIsOpen(true);
    
    // Mark all as read
    if (unreadCount > 0) {
      await supabase
        .from('money_chat_metadata')
        .update({ unread_count: 0 })
        .eq('user_id', currentUserId);
      
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('money-chat-proofs')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('money-chat-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage && !voiceRecorder.audioUrl) {
      return;
    }

    setIsSending(true);

    try {
      let mediaUrl: string | undefined;
      let messageType: 'text' | 'image' | 'voice' = 'text';
      let isPaymentProof = false;

      // Handle image upload
      if (selectedImage) {
        mediaUrl = await uploadImage(selectedImage);
        messageType = 'image';
        isPaymentProof = true; // Assume images are payment proofs
      }

      // Handle voice recording
      if (voiceRecorder.audioUrl) {
        // Voice recorder manages its own blob, just use the URL
        mediaUrl = voiceRecorder.audioUrl;
        messageType = 'voice';
      }

      // Send message
      const { error } = await supabase.rpc('send_money_chat_message', {
        p_user_id: currentUserId,
        p_sender_type: 'user',
        p_message_type: messageType,
        p_content: newMessage.trim() || null,
        p_media_url: mediaUrl || null,
        p_is_payment_proof: isPaymentProof
      });

      if (error) throw error;

      // Clear inputs
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview('');
      voiceRecorder.cancelRecording();

    } catch (error) {
      console.error('Error sending money chat message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Open Money Chat"
      >
        <DollarSign className="w-6 h-6" />
        <span className="font-bold text-lg tracking-wider">$$$</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl tracking-wider">$$$ CHAT</h2>
              <p className="text-white/80 text-sm">The Banker • Talent Top-Ups</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/60 text-xs">Your Balance</p>
              <p className="text-white font-bold text-lg">{talentBalance} 💎</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Welcome to $$$ Chat</p>
              <p className="text-sm mt-2">Send payment proof to buy more Talents</p>
              <p className="text-xs mt-4 text-white/30">Text • Screenshots • Voice</p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.sender_type === 'user';
            const isStrikethrough = msg.is_strikethrough;

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    isUser
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-white border border-white/10'
                  } ${isStrikethrough ? 'opacity-40 line-through' : ''}`}
                >
                  {/* Text Content */}
                  {msg.content && (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* Image */}
                  {msg.message_type === 'image' && msg.media_url && (
                    <div className="mt-2">
                      <img
                        src={msg.media_url}
                        alt="Payment proof"
                        className="rounded-lg max-w-full h-auto"
                      />
                      {msg.is_payment_proof && (
                        <div className="mt-2 text-xs opacity-70 flex items-center gap-1">
                          <span>📸 Payment Proof</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice */}
                  {msg.message_type === 'voice' && msg.media_url && (
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={msg.media_url} type="audio/webm" />
                      </audio>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`mt-2 text-xs ${
                      isUser ? 'text-white/60' : 'text-white/40'
                    }`}
                  >
                    <TimeAgo date={msg.created_at} />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-6 py-4 border-t border-white/10 bg-zinc-800/50">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-24 rounded-lg border border-white/20"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview('');
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Voice Recording */}
        {voiceRecorder.isRecording && (
          <div className="px-6 py-4 border-t border-white/10 bg-red-900/20">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white">Recording voice message...</span>
            </div>
            <p className="text-white/80 text-sm text-center mt-2">Release to send</p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 bg-zinc-900">
          <div className="flex items-end gap-3">
            {/* Image Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white/60 hover:text-white transition-colors p-2"
              aria-label="Upload payment screenshot"
              disabled={isSending}
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Voice Recording */}
            <button
              onMouseDown={voiceRecorder.startRecording}
              onMouseUp={voiceRecorder.stopRecording}
              onTouchStart={voiceRecorder.startRecording}
              onTouchEnd={voiceRecorder.stopRecording}
              className={`p-2 transition-colors ${
                voiceRecorder.isRecording
                  ? 'text-red-500'
                  : 'text-white/60 hover:text-white'
              }`}
              aria-label="Hold to record voice"
              disabled={isSending}
            >
              <Mic className="w-6 h-6" />
            </button>

            {/* Text Input */}
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message The Banker..."
              className="flex-1 bg-zinc-800 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={1}
              disabled={isSending}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={isSending || (!newMessage.trim() && !selectedImage && !voiceRecorder.audioUrl)}
              className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-white/40 text-white p-3 rounded-xl transition-colors"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>

          <p className="text-white/40 text-xs text-center mt-3">
            Send payment proof • Admin will manually top-up your balance
          </p>
        </div>
      </div>
    </div>
  );
}
