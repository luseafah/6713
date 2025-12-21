'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import ProfileConnections from './ProfileConnections';

interface GhostProfileProps {
  ghostUserId: string;
  shrineMedia?: string;
  currentUserId: string;
  displayName?: string;
}

export default function GhostProfile({ 
  ghostUserId, 
  shrineMedia,
  currentUserId,
  displayName = 'User'
}: GhostProfileProps) {
  const [cprCount, setcprCount] = useState(0);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [secretLink, setSecretLink] = useState<string | null>(null);
  const [userGaveCPR, setUserGaveCPR] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCPRStatus();
  }, [ghostUserId]);

  const loadCPRStatus = async () => {
    try {
      const response = await fetch(`/api/cpr?ghost_user_id=${ghostUserId}`);
      const data = await response.json();
      
      if (response.ok) {
        setcprCount(data.cpr_count);
        setSecretRevealed(data.secret_revealed);
        setSecretLink(data.secret_link);
        
        // Check if current user already gave CPR
        const userCPR = data.rescuers?.find(
          (r: any) => r.rescuer_user_id === currentUserId
        );
        setUserGaveCPR(!!userCPR);
      }
    } catch (error) {
      console.error('Failed to load CPR status:', error);
    }
  };

  const handleGiveCPR = async () => {
    if (userGaveCPR || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/cpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghost_user_id: ghostUserId,
          rescuer_user_id: currentUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserGaveCPR(true);
        await loadCPRStatus();
      } else {
        alert(data.error || 'Failed to give CPR');
      }
    } catch (error) {
      console.error('Failed to give CPR:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center p-4">
      {/* Profile Connections Row */}
      <div className="w-full max-w-md mb-6">
        <ProfileConnections 
          userId={ghostUserId}
          displayName={displayName}
        />
      </div>

      {/* Looping Shrine Media */}
      {shrineMedia && (
        <div className="w-full max-w-md aspect-square bg-white/5 rounded-lg overflow-hidden mb-6">
          <video
            src={shrineMedia}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* CPR Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-white text-2xl font-bold mb-4">Ghost Profile</h2>
        
        <div className="mb-6">
          <p className="text-white/60 text-sm mb-2">CPR Progress</p>
          <p className="text-white text-4xl font-bold">
            {cprCount} / 13
          </p>
          <p className="text-white/40 text-xs mt-1">
            1 CPR = 1 Talent
          </p>
        </div>

        {/* CPR Button */}
        {!secretRevealed && (
          <button
            onClick={handleGiveCPR}
            disabled={userGaveCPR || loading}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
              userGaveCPR
                ? 'bg-green-900/20 border-2 border-green-500/50 text-green-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Heart size={24} className={userGaveCPR ? 'fill-current' : ''} />
            {userGaveCPR ? 'CPR Given' : 'Give CPR'}
          </button>
        )}

        {/* Secret Link Revealed */}
        {secretRevealed && secretLink && (
          <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4 animate-pulse">
            <p className="text-purple-400 text-sm font-medium mb-2">
              🔓 Secret Link Revealed
            </p>
            <p className="text-white/60 text-xs mb-3">View once only</p>
            <a
              href={secretLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium inline-block transition-colors"
            >
              Open Secret Link
            </a>
          </div>
        )}

        {!secretRevealed && (
          <p className="text-white/40 text-sm mt-4">
            {13 - cprCount} more CPR needed to reveal secret
          </p>
        )}
      </div>
    </div>
  );
}
