'use client';

import { useState, useEffect } from 'react';
import { X, Heart, Users } from 'lucide-react';
import { Profile } from '@/types/database';
import { RemembranceWiki } from '@/types/remembrance';
import ProfilePictureReveal from './ProfilePictureReveal';
import GraphyFlashNotification from './GraphyFlashNotification';

interface ComaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  username: string;
  currentUserId?: string;
}

export default function ComaModal({ isOpen, onClose, profile, username, currentUserId }: ComaModalProps) {
  const [viewerTalentBalance, setViewerTalentBalance] = useState(0);
  const [blockerPreference, setBlockerPreference] = useState<'black' | 'white'>('black');
  const [remembranceWikis, setRemembranceWikis] = useState<RemembranceWiki[]>([]);
  const [loadingWikis, setLoadingWikis] = useState(false);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchViewerData();
    }
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (isOpen && profile) {
      setBlockerPreference(profile.blocker_preference || 'black');
      fetchRemembranceWikis();
    }
  }, [isOpen, profile]);

  const fetchViewerData = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/profile?user_id=${currentUserId}`);
      const data = await response.json();
      setViewerTalentBalance(data.talent_balance || 0);
    } catch (error) {
      console.error('Failed to fetch viewer data:', error);
    }
  };

  const fetchRemembranceWikis = async () => {
    if (!profile) return;
    
    setLoadingWikis(true);
    try {
      const response = await fetch(`/api/remembrance/list?creator_id=${profile.id}`);
      const data = await response.json();
      setRemembranceWikis(data.wikis || []);
    } catch (error) {
      console.error('Failed to fetch remembrance wikis:', error);
    } finally {
      setLoadingWikis(false);
    }
  };

  const handleRevealPurchase = async () => {
    // Refresh viewer's talent balance after purchase
    await fetchViewerData();
  };

  const handleClickTagger = (creatorId: string) => {
    // Close current modal and open the tagger's profile
    // This would require passing a callback from parent to switch profiles
    console.log('Open profile for creator:', creatorId);
    // TODO: Implement profile switching if needed
  };

  if (!isOpen || !profile) return null;

  const isVerified = !!profile.verified_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {profile.nickname || `@${username}`}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Graphy Flash Notification - Shows who tagged this user */}
        {profile.id && (
          <div className="mb-6">
            <GraphyFlashNotification
              userId={profile.id}
              onClickTagger={handleClickTagger}
            />
          </div>
        )}

        {/* Profile Picture with Reveal System */}
        {currentUserId && (
          <div className="mb-6">
            <ProfilePictureReveal
              profilePhotoUrl={profile.profile_photo_url}
              blockerPreference={blockerPreference}
              viewedUserId={profile.id}
              viewerUserId={currentUserId}
              viewerTalentBalance={viewerTalentBalance}
              onRevealPurchase={handleRevealPurchase}
              className="w-full h-64"
            />
          </div>
        )}

        {/* Pinned Gig (Verified Users Only) */}
        {isVerified && profile.pinned_gig_id && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-xs font-medium mb-2">📌 PINNED GIG</p>
            <p className="text-white text-sm">Gig ID: {profile.pinned_gig_id}</p>
            {/* TODO: Fetch and display actual gig details */}
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name - Only show if viewer is verified */}
          {profile.first_name && profile.last_name && (
            <div>
              <p className="text-white/60 text-sm mb-1">Full Name</p>
              <p className="text-white text-lg font-medium">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
          )}

          {/* Username */}
          <div>
            <p className="text-white/60 text-sm mb-1">Username</p>
            <p className="text-white text-lg">@{username}</p>
          </div>

          {/* COMA Status */}
          <div>
            <p className="text-white/60 text-sm mb-1">COMA Status</p>
            <p className={`text-lg font-medium ${profile.coma_status ? 'text-red-400' : 'text-green-400'}`}>
              {profile.coma_status ? 'In COMA' : 'Active'}
            </p>
          </div>

          {profile.coma_status && profile.coma_reason && (
            <div>
              <p className="text-white/60 text-sm mb-1">Reason</p>
              <p className="text-white text-lg font-medium">{profile.coma_reason}</p>
            </div>
          )}

          {profile.wiki && (
            <div>
              <p className="text-white/60 text-sm mb-1">Wiki / Bio</p>
              <p className="text-white whitespace-pre-wrap">{profile.wiki}</p>
            </div>
          )}

          {/* Signature Phrase */}
          {profile.signature_phrase && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-400 text-xs font-medium mb-1">A Phrase I Always Say</p>
              <p className="text-white italic">&quot;{profile.signature_phrase}&quot;</p>
            </div>
          )}

          {/* Hobbies */}
          {profile.hobbies && (
            <div>
              <p className="text-white/60 text-sm mb-1">Hobbies</p>
              <p className="text-white">{profile.hobbies}</p>
            </div>
          )}

          {/* Movies */}
          {profile.movies && profile.movies.length > 0 && (
            <div>
              <p className="text-white/60 text-sm mb-1">Favorite Movies</p>
              <ol className="list-decimal list-inside space-y-1">
                {profile.movies.slice(0, 3).map((movie, idx) => (
                  <li key={idx} className="text-white">{movie}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Songs */}
          {profile.songs && profile.songs.length > 0 && (
            <div>
              <p className="text-white/60 text-sm mb-1">Favorite Songs</p>
              <ol className="list-decimal list-inside space-y-1">
                {profile.songs.slice(0, 3).map((song, idx) => (
                  <li key={idx} className="text-white">{song}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Talent Balance (optional - show if viewing own profile) */}
          {currentUserId === profile.id && (
            <div>
              <p className="text-white/60 text-sm mb-1">Talent Balance</p>
              <p className="text-yellow-400 text-lg font-medium">{profile.talent_balance}T</p>
            </div>
          )}

          {/* Remembrance Wikis Section */}
          {remembranceWikis.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Heart size={18} className="text-pink-400" />
                <h3 className="text-white text-lg font-bold">Remembrance Wikis</h3>
              </div>
              {loadingWikis ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {remembranceWikis.map((wiki) => (
                    <div
                      key={wiki.id}
                      className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{wiki.title}</h4>
                          {wiki.relationship && (
                            <p className="text-pink-400 text-xs mt-1">
                              {wiki.relationship}
                            </p>
                          )}
                        </div>
                        {wiki.subject_user_id && (
                          <Users size={16} className="text-pink-400" />
                        )}
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap line-clamp-3">
                        {wiki.content}
                      </p>
                      {wiki.tags && wiki.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {wiki.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded"
                            >
                              @{tag.tagged_username}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
