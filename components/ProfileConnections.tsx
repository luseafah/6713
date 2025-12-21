'use client';

import { useState } from 'react';
import { Phone, Star } from 'lucide-react';

interface Connection {
  connection_user_id: string;
  connection_user_name: string;
  connection_profile_photo: string;
  connection_date: string;
}

interface DiscoveredUser {
  user_id: string;
  display_name: string;
  profile_photo: string;
  gig_stars: number;
  follower_count: number;
  latest_post_expires_at: string | null;
}

interface DiscoveryModalProps {
  user: DiscoveredUser;
  onClose: () => void;
}

function DiscoveryModal({ user, onClose }: DiscoveryModalProps) {
  const handleNavigate = () => {
    window.location.href = `/hue?user=${user.user_id}`;
  };

  // Calculate time remaining for latest post
  const getTimeRemaining = () => {
    if (!user.latest_post_expires_at) return 'No active posts';
    
    const now = new Date();
    const expires = new Date(user.latest_post_expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
    return `Expires in ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900/40 to-black border-2 border-purple-500/30 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-1">Random Discovery</h3>
          <p className="text-white/60 text-sm">Someone from the network</p>
        </div>

        {/* Profile Photo */}
        <div className="flex justify-center mb-6">
          {user.profile_photo ? (
            <img
              src={user.profile_photo}
              alt={user.display_name}
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/50"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-purple-500/50" />
          )}
        </div>

        {/* User Info */}
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <h4 className="text-2xl font-bold text-white mb-1">{user.display_name}</h4>
          </div>

          {/* Gig Stars */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Gig Rating</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < user.gig_stars
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Follower Count */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Followers</span>
              <span className="text-purple-400 font-bold font-mono">
                {user.follower_count.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Post Expiry */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Latest Post</span>
              <span className="text-purple-400 text-sm font-semibold">
                {getTimeRemaining()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 border border-white/20 text-white font-semibold py-3 rounded-lg hover:bg-white/20 transition-all"
          >
            Close
          </button>
          <button
            onClick={handleNavigate}
            className="flex-1 bg-gradient-to-r from-pink-600 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-pink-500 hover:to-red-400 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">❤️</span>
            Visit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProfileConnectionsProps {
  userId: string;
  displayName: string;
}

export default function ProfileConnections({ userId, displayName }: ProfileConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [involvementCount, setInvolvementCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [discoveredUser, setDiscoveredUser] = useState<DiscoveredUser | null>(null);
  const [discovering, setDiscovering] = useState(false);

  // Format large numbers (1200 → 1.2k)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Load connections on mount
  useState(() => {
    const loadConnections = async () => {
      try {
        const response = await fetch(`/api/gig/connections?user_id=${userId}`);
        const data = await response.json();

        if (response.ok) {
          setConnections(data.connections || []);
          setInvolvementCount(data.involvement_count || 0);
        }
      } catch (error) {
        console.error('Failed to load connections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  });

  const handleDiscover = async () => {
    if (discovering) return;

    setDiscovering(true);
    try {
      const response = await fetch(`/api/gig/random-connection?user_id=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setDiscoveredUser(data.user);
      } else {
        alert('No connections found for discovery');
      }
    } catch (error) {
      console.error('Failed to discover connection:', error);
      alert('Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-black border-2 border-purple-500/30 rounded-xl p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-white/10 rounded-full" />
          <div className="h-4 bg-white/10 rounded flex-1" />
        </div>
      </div>
    );
  }

  if (connections.length === 0 && involvementCount === 0) {
    return null; // Don't show if no connections
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-900/20 to-black border-2 border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {/* Recent Connection Photos */}
          <div className="flex -space-x-2">
            {connections.slice(0, 3).map((conn, i) => (
              <div key={conn.connection_user_id} className="relative">
                {conn.connection_profile_photo ? (
                  <img
                    src={conn.connection_profile_photo}
                    alt={conn.connection_user_name}
                    className="w-10 h-10 rounded-full border-2 border-black object-cover"
                    style={{ zIndex: 3 - i }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-black bg-gradient-to-br from-purple-500 to-pink-500"
                    style={{ zIndex: 3 - i }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Involvement Text */}
          <div className="flex-1">
            <p className="text-white text-sm">
              <span className="font-semibold text-purple-400">@{displayName}</span>
              <span className="text-white/60"> +{formatCount(involvementCount)} involved</span>
            </p>
          </div>

          {/* Discovery Button */}
          <button
            onClick={handleDiscover}
            disabled={discovering || connections.length === 0}
            className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-full hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Discover random connection"
          >
            {discovering ? (
              <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full" />
            ) : (
              <Phone className="w-5 h-5 text-purple-400" />
            )}
          </button>
        </div>
      </div>

      {/* Discovery Modal */}
      {discoveredUser && (
        <DiscoveryModal
          user={discoveredUser}
          onClose={() => setDiscoveredUser(null)}
        />
      )}
    </>
  );
}
