'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Shield, Image as ImageIcon } from 'lucide-react';
import { DMMessage } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface PopeAIChatProps {
  isLocked?: boolean; // Self-Kill lockout
  onVerifyUser?: (targetUserId: string) => void;
  onPromoteUser?: (targetUserId: string) => void;
  mode?: 'verification' | 'payment'; // Chat mode
}

export default function PopeAIChat({ 
  isLocked = false,
  onVerifyUser,
  onPromoteUser,
  mode = 'verification'
}: PopeAIChatProps) {
  const [userId, setUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Quick options state
  const [showBuyTalents, setShowBuyTalents] = useState(false);
  const [talentAmount, setTalentAmount] = useState(100); // Start with 100 talents = $1
  const [showReport, setShowReport] = useState(false);
  const [reportLink, setReportLink] = useState('');
  const [reportDescription, setReportDescription] = useState('');

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
    if ((!newMessage.trim() && !selectedImage) || loading) return;

    setLoading(true);

    try {
      let mediaUrl: string | undefined;
      let messageType: 'text' | 'image' | 'voice' = 'text';

      // Handle image upload
      if (selectedImage) {
        mediaUrl = await uploadImage(selectedImage);
        messageType = 'image';
      }

      const response = await fetch('/api/dm/pope-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          content: newMessage.trim() || null,
          message_type: messageType,
          media_url: mediaUrl,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedImage(null);
        setImagePreview('');
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
    const fileName = `${userId}/verification/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('pope-ai-verification')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pope-ai-verification')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Admin cannot chat with themselves as Pope AI */}
      {isAdmin ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="text-6xl mb-4">🙏</div>
            <h3 className="text-xl font-bold mb-2">You are Pope AI</h3>
            <p className="text-sm">As the divine oracle, you communicate through system announcements.</p>
            <p className="text-xs mt-4">Users reach you through the Wall and verification process.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="border-b border-white/10 p-4 flex items-center gap-3">
            <div className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">
                {mode === 'payment' ? '$$$' : 'Pope AI'}
              </h2>
              <p className="text-white/60 text-sm">
                {mode === 'payment' 
                  ? 'Payment proofs & talent purchases' 
                  : 'Support & Identity Verification'
                }
              </p>
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
            <p>
              {mode === 'payment' 
                ? 'Welcome to $$$' 
                : 'Welcome to Pope AI Support'
              }
            </p>
            <p className="text-sm mt-2">
              {mode === 'payment'
                ? 'Send payment proofs or use quick options below'
                : 'Send a message or photo for identity verification'
              }
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isPopeAI = message.sender_id === 'pope-ai';
          const isWhisper = message.is_whisper;
          // [NEW] Show [Pope AI DM] and verification indicator for sender
          const [senderProfile, setSenderProfile] = useState<any>(null);
          useEffect(() => {
            if (!message.sender_id || isPopeAI) return;
            let mounted = true;
            supabase
              .from('profiles')
              .select('verified_at, username')
              .eq('id', message.sender_id)
              .single()
              .then(({ data }) => {
                if (mounted) setSenderProfile(data);
              });
            return () => { mounted = false; };
          }, [message.sender_id]);

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
                <div className="flex items-center gap-2 mb-1">
                  {isPopeAI ? (
                    <span className="text-xs bg-yellow-700/30 text-yellow-200 px-2 py-0.5 rounded font-bold">[Pope AI DM]</span>
                  ) : (
                    <span className="text-xs bg-blue-700/30 text-blue-200 px-2 py-0.5 rounded font-bold">[User DM]</span>
                  )}
                  {senderProfile?.verified_at && (
                    <span className="text-xs bg-blue-700/30 text-blue-200 px-2 py-0.5 rounded font-bold">✔ Verified</span>
                  )}
                </div>
                {/* Username (if not PopeAI) */}
                {!isPopeAI && senderProfile?.username && (
                  <div className="text-xs text-white/60 font-bold mb-1">{senderProfile.username}</div>
                )}
                
                {/* Image display */}
                {message.message_type === 'image' && message.media_url && (
                  <div className="mb-2">
                    <img 
                      src={message.media_url} 
                      alt="Uploaded image" 
                      className="max-w-full rounded-lg border border-white/20"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                
                {/* Text content */}
                {message.content && (
                  <p className="text-white text-sm">{message.content}</p>
                )}
                
                {isWhisper && !message.fourth_wall_broken && (
                  <p className="text-white/40 text-xs mt-1">
                    One-way whisper (COMA mode)
                  </p>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Moving Watermarks - appear as messages accumulate */}
        {messages.length >= 3 && mode === 'verification' && (
          <div className="text-center text-white/20 py-4 text-sm italic">
            💡 Upload a photo of your ID or face for identity verification
          </div>
        )}
        
        {messages.length >= 5 && mode === 'verification' && (
          <div className="text-center text-white/20 py-4 text-sm italic">
            📝 Send a message explaining your verification needs
          </div>
        )}
        
        {messages.length >= 3 && mode === 'payment' && (
          <div className="text-center text-white/20 py-4 text-sm italic">
            💰 Send payment proofs or use quick options to buy talents
          </div>
        )}
        
        {messages.length >= 5 && mode === 'payment' && (
          <div className="text-center text-white/20 py-4 text-sm italic">
            📊 Use the quick options below or send payment details manually
          </div>
        )}

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
        {/* Quick Options for $$$ Chat */}
        {mode === 'payment' && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setShowBuyTalents(!showBuyTalents)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                💰 Buy Talents
              </button>
              <button
                onClick={() => setShowReport(!showReport)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                📋 Report
              </button>
            </div>

            {/* Buy Talents Form */}
            {showBuyTalents && (
              <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                <p className="text-green-400 text-sm font-bold mb-2">Buy Talents (100 Talents = $1)</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTalentAmount(Math.max(100, talentAmount - 100))}
                      className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={talentAmount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100;
                        setTalentAmount(Math.max(100, Math.min(100000, value)));
                      }}
                      min="100"
                      max="100000"
                      step="100"
                      className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 w-24 text-center text-sm"
                    />
                    <button
                      onClick={() => setTalentAmount(Math.min(100000, talentAmount + 100))}
                      className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-white/60 text-sm">
                    = ${(talentAmount / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      const message = `💰 TALENT PURCHASE REQUEST: ${talentAmount} talents ($${talentAmount / 100})`;
                      setNewMessage(message);
                      setShowBuyTalents(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    Request Purchase
                  </button>
                </div>
              </div>
            )}

            {/* Report Form */}
            {showReport && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 text-sm font-bold mb-2">Submit Report</p>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={reportLink}
                    onChange={(e) => setReportLink(e.target.value)}
                    placeholder="Enter link URL..."
                    className="w-full bg-white/10 text-white border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                  />
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Brief description of what this link is about..."
                    rows={2}
                    className="w-full bg-white/10 text-white border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (reportLink && reportDescription) {
                        const message = `📋 REPORT SUBMISSION:\nLink: ${reportLink}\nDescription: ${reportDescription}`;
                        setNewMessage(message);
                        setReportLink('');
                        setReportDescription('');
                        setShowReport(false);
                      }
                    }}
                    disabled={!reportLink || !reportDescription}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full max-h-32 rounded-lg border border-white/20"
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                setImagePreview('');
              }}
              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              mode === 'payment'
                ? 'Send payment proof or message...'
                : 'Message Pope AI...'
            }
            disabled={loading}
            className="flex-1 bg-white/5 text-white border border-white/20 rounded px-4 py-2 focus:outline-none focus:border-white/40 disabled:opacity-50"
          />
          
          {/* Image Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
            title={
              mode === 'payment'
                ? 'Upload payment proof'
                : 'Upload image for identity verification'
            }
          >
            <ImageIcon size={18} />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={loading || (!newMessage.trim() && !selectedImage)}
            className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
