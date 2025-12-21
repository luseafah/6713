'use client';

import { useEffect, useState } from 'react';
import { Profile } from '@/types/database';
import PopeAIChat from './PopeAIChat';

interface VoidScreenProps {
  userId: string;
  profile: Profile;
}

export default function VoidScreen({ userId, profile }: VoidScreenProps) {
  const [shrineMedia, setShrineMedia] = useState(profile.shrine_media || '');
  const [shrineLink, setShrineLink] = useState(profile.shrine_link || '');
  const [cprCount, setCprCount] = useState(0);
  const [editCost, setEditCost] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCPRCount();
    checkEditCost();
  }, [userId]);

  const loadCPRCount = async () => {
    try {
      const response = await fetch(`/api/cpr?ghost_user_id=${userId}`);
      const data = await response.json();
      setCprCount(data.count || 0);
    } catch (error) {
      console.error('Failed to load CPR count:', error);
    }
  };

  const checkEditCost = async () => {
    try {
      const response = await fetch(`/api/shrine/edit?user_id=${userId}`);
      const data = await response.json();
      setEditCost(data.cost || 0);
    } catch (error) {
      console.error('Failed to check edit cost:', error);
    }
  };

  const handleSaveShrine = async () => {
    if (saving) return;

    if (editCost > 0 && profile.talent_balance < editCost) {
      setError(`Insufficient Talents. Need ${editCost} to edit again today.`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/shrine/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          shrine_media: shrineMedia,
          shrine_link: shrineLink,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      alert('Shrine updated successfully!');
      checkEditCost(); // Refresh cost
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const timeRemaining = profile.deactivated_at
    ? Math.max(0, 72 - Math.floor((Date.now() - new Date(profile.deactivated_at).getTime()) / (1000 * 60 * 60)))
    : 0;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-2">THE VOID</h1>
        <p className="text-gray-400">
          You are in limbo. {timeRemaining} hours remaining until permanent deletion.
        </p>
        <p className="text-purple-400 text-lg mt-2">
          CPR Count: {cprCount} / 13 (1 CPR = 1 Talent)
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Ghost Media & Shrine Editor */}
        <div className="space-y-6">
          {/* Looping Ghost Media */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Your Ghost Media</h2>
            {shrineMedia ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {shrineMedia.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={shrineMedia}
                    alt="Ghost Media"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={shrineMedia}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No media uploaded</p>
              </div>
            )}
          </div>

          {/* Shrine Editor */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Manage Shrine</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ghost Media URL
                </label>
                <input
                  type="text"
                  value={shrineMedia}
                  onChange={(e) => setShrineMedia(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Secret Link (Revealed to 13 Rescuers)
                </label>
                <input
                  type="text"
                  value={shrineLink}
                  onChange={(e) => setShrineLink(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleSaveShrine}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : editCost > 0 ? `Save (${editCost} Talents)` : 'Save (Free)'}
              </button>

              <p className="text-sm text-gray-500 text-center">
                First edit per 24 hours is free. Additional edits cost 10 Talents.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Pope AI Chat */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Pope AI Support</h2>
          <div className="h-[600px]">
            <PopeAIChat />
          </div>
        </div>
      </div>
    </div>
  );
}
