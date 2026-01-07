'use client';

import { useEffect, useState, useRef } from 'react';
import { Send, Shield, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
          <motion.div
            className="border-b border-white/10 p-4 flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield size={24} className="text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.h2
                className="text-white font-bold"
                key={mode} // Re-animate when mode changes
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {mode === 'payment' ? '$$$' : 'Pope AI'}
              </motion.h2>
              <motion.p
                className="text-white/60 text-sm"
                key={`desc-${mode}`} // Re-animate when mode changes
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {mode === 'payment' 
                  ? 'Payment proofs & talent purchases' 
                  : 'Support & Identity Verification'
                }
              </motion.p>
            </div>
          </motion.div>

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
        <AnimatePresence mode="wait">
          {messages.length === 0 && (
            <motion.div
              className="text-center text-white/40 py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {mode === 'payment' 
                  ? 'Welcome to $$$' 
                  : 'Welcome to Pope AI Support'
                }
              </motion.p>
              <motion.p
                className="text-sm mt-2"
                key={`sub-${mode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {mode === 'payment'
                  ? 'Send payment proofs or use quick options below'
                  : 'Send a message or photo for identity verification'
                }
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {messages.map((message, index) => {
            const isPopeAI = message.sender_id === 'pope-ai';
            const isWhisper = message.is_whisper;

            return (
              <motion.div
                key={message.id}
                className={`flex ${isPopeAI ? 'justify-start' : 'justify-end'}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05, // Staggered animation
                  type: "spring",
                  stiffness: 100
                }}
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
          <motion.div
            className="text-center text-white/20 py-4 text-sm italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            💡 Upload a photo of your ID or face for identity verification
          </motion.div>
        )}
        
        {messages.length >= 5 && mode === 'verification' && (
          <motion.div
            className="text-center text-white/20 py-4 text-sm italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            📝 Send a message explaining your verification needs
          </motion.div>
        )}
        
        {messages.length >= 3 && mode === 'payment' && (
          <motion.div
            className="text-center text-white/20 py-4 text-sm italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            💰 Send payment proofs or use quick options to buy talents
          </motion.div>
        )}
        
        {messages.length >= 5 && mode === 'payment' && (
          <motion.div
            className="text-center text-white/20 py-4 text-sm italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            📊 Use the quick options below or send payment details manually
          </motion.div>
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
      <motion.div
        className="border-t border-white/10 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Quick Options for $$$ Chat */}
        <AnimatePresence>
          {mode === 'payment' && (
            <motion.div
              className="mb-4 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.button
                  onClick={() => setShowBuyTalents(!showBuyTalents)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💰 Buy Talents
                </motion.button>
                <motion.button
                  onClick={() => setShowReport(!showReport)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📋 Report
                </motion.button>
              </motion.div>

              {/* Buy Talents Form */}
              <AnimatePresence>
                {showBuyTalents && (
                  <motion.div
                    className="bg-green-900/20 border border-green-500/30 rounded p-3"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-green-400 text-sm font-bold mb-2">Buy Talents (100 Talents = $1)</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => setTalentAmount(Math.max(100, talentAmount - 100))}
                          className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-sm"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          -
                        </motion.button>
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
                        <motion.button
                          onClick={() => setTalentAmount(Math.min(100000, talentAmount + 100))}
                          className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-sm"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          +
                        </motion.button>
                      </div>
                      <span className="text-white/60 text-sm">
                        = ${(talentAmount / 100).toFixed(2)}
                      </span>
                      <motion.button
                        onClick={() => {
                          const message = `💰 TALENT PURCHASE REQUEST: ${talentAmount} talents ($${talentAmount / 100})`;
                          setNewMessage(message);
                          setShowBuyTalents(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Request Purchase
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Report Form */}
              <AnimatePresence>
                {showReport && (
                  <motion.div
                    className="bg-blue-900/20 border border-blue-500/30 rounded p-3"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                      <motion.button
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
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Submit Report
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              className="mb-3 relative"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-full max-h-32 rounded-lg border border-white/20"
              />
              <motion.button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview('');
                }}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Field and Send Button */}
        <motion.div
          className="flex gap-3 items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <motion.div
            className="flex-1 relative"
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={mode === 'verification' ? "Describe your verification request..." : "Type your message..."}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-white/40 resize-none min-h-[44px] max-h-32"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-3 text-white/60 hover:text-white/80 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              📎
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </motion.div>

          <motion.button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !selectedImage}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={loading ? { scale: [1, 1.05, 1] } : {}}
            transition={loading ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Sending...
              </>
            ) : (
              <>
                <span>Send</span>
                <span className="text-lg">🚀</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
        </>
      )}
    </div>
  );
}
