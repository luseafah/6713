'use client';

import { useState } from 'react';
import { Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuoteButtonProps {
  currentUserId: string;
  isVerified: boolean;
  onQuote: (quotedPhrase: string, quotedUserId: string, quotedUsername: string) => Promise<void>;
}

interface QuoteableProfile {
  id: string;
  username: string;
  signature_phrase?: string;
  verified_at?: string;
}

export default function QuoteButton({ currentUserId, isVerified, onQuote }: QuoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<QuoteableProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<QuoteableProfile | null>(null);

  if (!isVerified) return null;

  const searchProfiles = async (query: string) => {
    if (!query.trim()) {
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/profile/search-verified?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Failed to search profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuote = async (profile: QuoteableProfile) => {
    if (!profile.signature_phrase) {
      alert('This user has no signature phrase to quote.');
      return;
    }

    setSelectedProfile(profile);
    await onQuote(profile.signature_phrase, profile.id, profile.username);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedProfile(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
        title="Quote verified user"
      >
        <Quote size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/20 rounded-lg p-6 max-w-md w-full"
            >
              <h2 className="text-white text-xl font-bold mb-4">Quote Verified User</h2>
              <p className="text-white/60 text-sm mb-4">
                Search for a verified user to quote their signature phrase on the Wall
              </p>

              {/* Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchProfiles(e.target.value);
                }}
                placeholder="Search by @username..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:border-purple-400 focus:outline-none mb-4"
                autoFocus
              />

              {/* Results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : profiles.length > 0 ? (
                  profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleQuote(profile)}
                      className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-left transition-colors"
                    >
                      <p className="text-white font-medium">@{profile.username}</p>
                      {profile.signature_phrase && (
                        <p className="text-white/60 text-sm italic mt-1">
                          &quot;{profile.signature_phrase}&quot;
                        </p>
                      )}
                    </button>
                  ))
                ) : searchQuery.trim() ? (
                  <p className="text-white/40 text-sm text-center py-4">No verified users found</p>
                ) : (
                  <p className="text-white/40 text-sm text-center py-4">Start typing to search</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                  setProfiles([]);
                }}
                className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
