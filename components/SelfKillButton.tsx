'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ghost, AlertTriangle } from 'lucide-react';
import { useDynamicMessage } from '@/hooks/useDynamicMessage';

export default function SelfKillButton({ userId }: { userId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [shrineMessage, setShrineMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { message } = useDynamicMessage('on_self_kill_initiate');

  const handleSelfKill = async () => {
    if (!shrineMessage.trim()) {
      alert('Please enter a shrine message');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc('user_self_kill', {
      p_shrine_message: shrineMessage.trim(),
    });

    if (error) {
      console.error('Error initiating self-kill:', error);
      alert('Failed to initiate protocol termination');
      setLoading(false);
      return;
    }

    // Reload page to show shrine state
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-medium transition-colors"
      >
        <Ghost className="w-4 h-4" />
        Self-Kill Protocol
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-red-500 rounded-lg w-full max-w-lg p-6 space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Initiate Self-Kill Protocol?
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {message?.content ||
                    'This action will enter your account into a 3-day Shrine period. After 3 days, all your data will be permanently deleted. This cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Shrine Message */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Shrine Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={shrineMessage}
                onChange={(e) => setShrineMessage(e.target.value)}
                placeholder="Your final message... (e.g., 'Left the frequency', 'Moving on to higher realms')"
                rows={3}
                maxLength={200}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-red-400 focus:outline-none resize-none"
              />
              <p className="text-xs text-zinc-500 mt-1">{shrineMessage.length}/200</p>
            </div>

            {/* Consequences */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-red-300">What happens:</p>
              <ul className="text-xs text-red-200 space-y-1 list-disc list-inside">
                <li>Your account enters Shrine mode immediately</li>
                <li>Others can view your profile and shrine message for 3 days</li>
                <li>All your posts, gigs, and messages remain visible for 3 days</li>
                <li>After 3 days, everything is permanently deleted</li>
                <li>Your Talent balance will be forfeited</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setShrineMessage('');
                }}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSelfKill}
                disabled={loading || !shrineMessage.trim()}
                className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ghost className="w-4 h-4" />
                    Confirm Self-Kill
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
