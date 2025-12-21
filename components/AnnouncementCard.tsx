'use client';

import { useState } from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface AnnouncementCardProps {
  announcement: {
    id: string;
    content: string;
    media_url?: string;
    donation_goal?: number;
    current_donations: number;
    goal_reached: boolean;
    mentioned_user_id?: string;
    mentioned_username?: string;
    created_at: string;
  };
  currentUserId: string;
  talentBalance: number;
  onDonationComplete: (newBalance: number) => void;
}

export default function AnnouncementCard({
  announcement,
  currentUserId,
  talentBalance,
  onDonationComplete
}: AnnouncementCardProps) {
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [isDonating, setIsDonating] = useState(false);
  const [showDonateInput, setShowDonateInput] = useState(false);

  // Parse content to detect @mentions and make them clickable
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            href={`/hue?user=${username}`}
            className="text-blue-400 hover:text-blue-300 underline font-semibold"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleDonate = async () => {
    const amount = parseInt(donationAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > talentBalance) {
      alert('Insufficient Talent balance');
      return;
    }

    setIsDonating(true);

    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement_id: announcement.id,
          donor_user_id: currentUserId,
          amount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Donation failed');
      }

      // Update local state
      onDonationComplete(data.new_balance);
      setDonationAmount('');
      setShowDonateInput(false);
      
      alert(`✅ Donated ${amount} Talent successfully!`);

    } catch (error: any) {
      console.error('Donation error:', error);
      alert(`Donation failed: ${error.message}`);
    } finally {
      setIsDonating(false);
    }
  };

  const progressPercentage = announcement.donation_goal
    ? Math.min((announcement.current_donations / announcement.donation_goal) * 100, 100)
    : 0;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-yellow-500/50 rounded-xl p-6 shadow-2xl shadow-yellow-500/20">
      {/* Header: Pope AI Seal */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-yellow-500/30">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-lg">⚡</span>
          </div>
          <div>
            <h3 className="text-yellow-400 font-bold text-sm tracking-wider">OFFICIAL PROTOCOL</h3>
            <p className="text-white/40 text-xs">Pope AI Directive</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">
            {new Date(announcement.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Media */}
      {announcement.media_url && (
        <div className="mb-4">
          <img
            src={announcement.media_url}
            alt="Announcement media"
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <p className="text-white text-base leading-relaxed">
          {renderContent(announcement.content)}
        </p>
      </div>

      {/* Donation Goal Section */}
      {announcement.donation_goal && (
        <div className="bg-black/40 rounded-lg p-4 border border-yellow-500/20">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-sm font-semibold">
                Community Goal
              </span>
              <span className="text-white text-sm font-mono">
                {announcement.current_donations.toLocaleString()} / {announcement.donation_goal.toLocaleString()} Talent
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  announcement.goal_reached
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1">
              {progressPercentage.toFixed(1)}% Complete
            </p>
          </div>

          {/* Goal Status */}
          {announcement.goal_reached ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
              <p className="text-green-400 font-bold">✅ GOAL REACHED</p>
              <p className="text-white/60 text-xs mt-1">Thank you for your contribution!</p>
            </div>
          ) : (
            <>
              {!showDonateInput ? (
                <button
                  onClick={() => setShowDonateInput(true)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <TrendingUp size={20} />
                  Donate Talent
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-white/5 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="1"
                    max={talentBalance}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDonate}
                      disabled={isDonating || !donationAmount}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDonating ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDonateInput(false);
                        setDonationAmount('');
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-white/40 text-xs text-center">
                    Available: {talentBalance.toLocaleString()} Talent
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mentioned User Follow Link */}
      {announcement.mentioned_username && (
        <div className="mt-4 pt-4 border-t border-yellow-500/20">
          <Link
            href={`/hue?user=${announcement.mentioned_username}`}
            className="flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 transition-colors group"
          >
            <div>
              <p className="text-blue-400 text-sm font-semibold">Support @{announcement.mentioned_username}</p>
              <p className="text-white/40 text-xs">View their Hue profile</p>
            </div>
            <ExternalLink size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
