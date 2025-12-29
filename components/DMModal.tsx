'use client';

import { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, UserPlus } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_whisper: boolean;
  created_at: string;
}

interface DMModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserRole: string;
  recipientId: string;
  recipientUsername: string;
  recipientComaStatus: boolean;
  recipientIsVerified: boolean;
  senderComaStatus: boolean;
  onSendMessage: (content: string, isWhisper: boolean) => void;
  onFourthWallBreak: () => void;
  onVerifyUser?: () => void;
  onMakeAdmin?: () => void;
  messages: Message[];
}

export default function DMModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserRole,
  recipientId,
  recipientUsername,
  recipientComaStatus,
  recipientIsVerified,
  senderComaStatus,
  onSendMessage,
  onFourthWallBreak,
  onVerifyUser,
  onMakeAdmin,
  messages,
  adminView = false,
  isPopeAI = false,
}: DMModalProps & { adminView?: boolean, isPopeAI?: boolean }) {
  const [messageContent, setMessageContent] = useState('');
  
  if (!isOpen) return null;

  const isPope = recipientUsername === 'Pope AI';
  const isAdmin = currentUserRole === 'admin';
  // Only Pope AI in admin mode sees admin chat features
  if (isPopeAI && adminView) {
    // Render admin chat features (existing logic)
    // ...existing code...
  } else {
    // Render regular chat features (existing logic)
    // ...existing code...
  }
  const canReply = !recipientComaStatus || senderComaStatus;
  const isWhisper = senderComaStatus;

  const handleSend = () => {
    if (messageContent.trim()) {
      onSendMessage(messageContent, isWhisper);
      setMessageContent('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="glassmorphism rounded-2xl w-full max-w-2xl h-[600px] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {recipientUsername[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{recipientUsername}</h3>
              <p className="text-xs text-white/60">
                {recipientComaStatus ? 'COMA Mode Active' : 'Online'}
                {recipientIsVerified && ' • Verified'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Admin Actions for Pope AI Chat */}
        {isPope && isAdmin && (
          <div className="p-4 bg-purple-500/10 border-b border-purple-500/30 flex space-x-3">
            <button
              onClick={onVerifyUser}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium">VERIFY</span>
            </button>
            <button
              onClick={onMakeAdmin}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">MAKE ADMIN</span>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/40 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      isSender
                        ? 'bg-purple-500/20 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {message.is_whisper && (
                      <span className="text-xs text-purple-300 italic">Whisper • </span>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COMA Warning */}
        {recipientComaStatus && !canReply && (
          <div className="px-4 py-3 bg-purple-500/10 border-t border-purple-500/30">
            <p className="text-sm text-purple-300">
              {recipientUsername} is in COMA mode. They can only send Whispers.
            </p>
            <button
              onClick={onFourthWallBreak}
              className="mt-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-all"
            >
              4th Wall Break (100 Talents)
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          {isWhisper && (
            <p className="text-xs text-purple-300 mb-2 italic">
              Sending as Whisper (one-way message)
            </p>
          )}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                isWhisper
                  ? 'Send a whisper...'
                  : canReply
                  ? 'Type a message...'
                  : 'Cannot reply to COMA users'
              }
              disabled={!canReply && !isWhisper}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={!messageContent.trim() || (!canReply && !isWhisper)}
              className="p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-full transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
