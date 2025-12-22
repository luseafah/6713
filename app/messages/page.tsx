'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PopeAIChat from '@/components/PopeAIChat';
import VerificationChatPinned from '@/components/VerificationChatPinned';
import MoneyChatPill from '@/components/MoneyChatPill';
import AppWrapper from '@/components/AppWrapper';

export default function MessagesPage() {
  const [userId, setUserId] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<'pope' | 'money' | null>('pope');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // Check verification status
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_at')
        .eq('id', user.id)
        .single();
      
      setIsVerified(!!profile?.verified_at);
    }
    setLoading(false);
  };

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  return (
    <main className="bg-black min-h-screen">
      <AppWrapper onNavigate={handleNavigate}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Chat Selection Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveChat('pope')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                activeChat === 'pope'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-zinc-800 text-white/60 hover:text-white'
              }`}
            >
              ⚡ Pope AI
            </button>
            <button
              onClick={() => setActiveChat('money')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${
                activeChat === 'money'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-white/60 hover:text-white'
              }`}
            >
              💰 $$$ Chat
            </button>
          </div>

          {/* Pinned Verification Chat (only for unverified users) */}
          {!loading && !isVerified && userId && activeChat === 'pope' && (
            <VerificationChatPinned userId={userId} />
          )}

          {/* Active Chat Display */}
          {activeChat === 'pope' && (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
              <PopeAIChat />
            </div>
          )}

          {activeChat === 'money' && (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
              <MoneyChatPill onClose={() => setActiveChat('pope')} />
            </div>
          )}

          {/* Help Text */}
          {!isVerified && activeChat === 'pope' && (
            <div className="mt-4 text-center text-white/40 text-sm">
              <p>Your verification is being processed by Pope AI</p>
              <p className="text-xs mt-1">You'll receive a notification when ready</p>
            </div>
          )}

          {activeChat === 'money' && (
            <div className="mt-4 text-center text-white/40 text-sm">
              <p>💵 Send payment proof • Admin manually tops up your Talent balance</p>
              <p className="text-xs mt-1">Text • Screenshots • Voice Messages</p>
            </div>
          )}
        </div>
      </AppWrapper>
    </main>
  );
}
