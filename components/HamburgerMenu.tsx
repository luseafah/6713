'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Wallet, Shield, ChevronRight, DollarSign, RefreshCw, Clock, Search, Hash, User, Music, Briefcase, QrCode, Camera, Link as LinkIcon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserStatus {
  talent_balance: number;
  cpr_count: number;
  is_coma: boolean;
  is_mod: boolean;
  is_admin: boolean;
  verification_status: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'purchase' | 'spend' | 'earn';
  description: string;
  created_at: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'human' | 'sound' | 'tag' | 'gig';
  subtitle?: string;
  count?: string;
  is_coma?: boolean;
  coma_cost?: number;
  is_verified?: boolean;
  profile_photo_url?: string;
  talent_reward?: number;
  deadline?: string;
  full_name?: string;
}

interface WatchHistoryItem {
  id: string;
  video_id: string;
  sound_name: string;
  artist_name: string;
  watched_at: string;
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function HamburgerMenu({ isOpen, onClose, userId }: HamburgerMenuProps) {
  const [viewAsStranger, setViewAsStranger] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  // Search State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'humans' | 'sounds' | 'tags' | 'gigs'>('humans');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [volatileTags, setVolatileTags] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [adminHiddenSearch, setAdminHiddenSearch] = useState(false); // Admin Eye toggle
  const [longPressTag, setLongPressTag] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareProfile, setShowShareProfile] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserStatus();
    }
  }, [isOpen, userId]);

  const loadUserStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('talent_balance, cpr_count, is_coma, is_mod, is_admin, verification_status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserStatus(data);
    } catch (err) {
      console.error('Error loading user status:', err);
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('talent_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleWalletClick = () => {
    if (!showWalletDropdown) {
      loadTransactions();
    }
    setShowWalletDropdown(!showWalletDropdown);
  };

  const toggleViewAsStranger = () => {
    setViewAsStranger(!viewAsStranger);
    
    // Store in localStorage to persist across pages
    if (!viewAsStranger) {
      localStorage.setItem('viewAsStranger', 'true');
    } else {
      localStorage.removeItem('viewAsStranger');
    }

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('viewModeChanged', { 
      detail: { viewAsStranger: !viewAsStranger } 
    }));
  };

  const formatTalents = (amount: number) => {
    return amount.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Load watch history and search history
  useEffect(() => {
    if (isOpen && userId) {
      loadWatchHistory();
      loadSearchHistory();
      loadVolatileTags();
    }
  }, [isOpen, userId]);

  const loadWatchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWatchHistory(data || []);
    } catch (err) {
      console.error('Error loading watch history:', err);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  };

  const loadVolatileTags = async () => {
    try {
      // Get device language
      const language = navigator.language.split('-')[0] || 'en';
      
      const { data, error } = await supabase.rpc('get_volatile_tags', {
        p_language_code: language,
        p_limit: 10
      });

      if (error) throw error;
      setVolatileTags((data || []).map((t: any) => t.tag));
    } catch (err) {
      console.error('Error loading volatile tags:', err);
    }
  };

  // Search execution
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      if (searchFilter === 'humans') {
        const { data, error } = await supabase.rpc('search_humans', {
          p_query: query,
          p_include_coma: adminHiddenSearch, // Admin can see COMA users
          p_limit: 20
        });

        if (error) throw error;

        setSearchResults((data || []).map((user: any) => ({
          id: user.id,
          name: user.username,
          type: 'human' as const,
          subtitle: user.full_name || user.display_name || '',
          is_coma: user.is_coma,
          coma_cost: user.coma_cost,
          is_verified: user.is_verified,
          profile_photo_url: user.profile_photo_url,
          full_name: user.full_name
        })));
      } else if (searchFilter === 'sounds') {
        const { data, error } = await supabase.rpc('search_sounds', {
          p_query: query,
          p_limit: 20
        });

        if (error) throw error;

        setSearchResults((data || []).map((sound: any) => ({
          id: sound.sound_id,
          name: sound.sound_name,
          type: 'sound' as const,
          subtitle: sound.artist_name,
          count: sound.video_count_display + ' Videos',
          is_verified: sound.is_verified
        })));
      } else if (searchFilter === 'gigs') {
        const { data, error } = await supabase.rpc('search_gigs', {
          p_query: query,
          p_limit: 20
        });

        if (error) throw error;

        setSearchResults((data || []).map((gig: any) => ({
          id: gig.gig_id,
          name: gig.gig_title,
          type: 'gig' as const,
          subtitle: `by @${gig.creator_username}`,
          talent_reward: gig.talent_reward,
          deadline: gig.deadline,
          is_verified: gig.is_verified_only
        })));
      } else {
        // Tag search - filter volatile tags
        const filtered = volatileTags.filter(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(filtered.map(tag => ({
          id: tag,
          name: '#' + tag,
          type: 'tag' as const,
          subtitle: 'Volatile Tag'
        })));
      }
    } catch (err) {
      console.error('Error performing search:', err);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter, adminHiddenSearch]);

  // Handle search result click
  const handleResultClick = async (result: SearchResult) => {
    // Save to search history
    await supabase.rpc('add_search_to_history', {
      p_user_id: userId,
      p_query: searchQuery,
      p_type: result.type,
      p_result_id: result.id,
      p_result_name: result.name
    });

    // Navigate to result
    if (result.type === 'human') {
      window.location.href = `/profile/${result.id}`;
    } else if (result.type === 'sound') {
      window.location.href = `/sound/${result.id}`;
    } else if (result.type === 'tag') {
      window.location.href = `/tag/${result.id}`;
    } else if (result.type === 'gig') {
      window.location.href = `/gig/${result.id}`;
    }

    onClose();
  };

  // Generate QR Code URL for profile
  const getProfileQRCodeURL = () => {
    const profileURL = `${window.location.origin}/profile/${userId}`;
    // Using qrcode.react or similar library would be better, but for now use an API
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileURL)}`;
  };

  // Admin: Tag long-press slash
  const handleTagLongPress = (tag: string) => {
    if (!userStatus?.is_admin && !userStatus?.is_mod) return;

    longPressTimerRef.current = setTimeout(() => {
      setLongPressTag(tag);
    }, 800); // 800ms long press
  };

  const handleTagLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleSlashTag = async (tag: string) => {
    try {
      const { error } = await supabase.rpc('slash_tag', {
        p_tag: tag,
        p_mod_user_id: userId,
        p_reason: 'Removed from search suggestions'
      });

      if (error) throw error;

      // Remove from volatile tags
      setVolatileTags(prev => prev.filter(t => t !== tag));
      setLongPressTag(null);
    } catch (err) {
      console.error('Error slashing tag:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150]"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-black via-gray-900 to-black border-r border-white/10 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Control Nook</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* SEARCH BAR - TOP OF HAMBURGER */}
            <div className="border-b border-white/10">
              <div className="p-4 space-y-3">
                {/* Search Input with Admin Eye Toggle */}
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => {
                        // Delay to allow click on results
                        setTimeout(() => setIsSearchFocused(false), 200);
                      }}
                      placeholder="Search Humans, Sounds, or Tags..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                    />
                  </div>
                  
                  {/* Admin Hidden Search Toggle */}
                  {(userStatus?.is_admin || userStatus?.is_mod) && (
                    <button
                      onClick={() => setAdminHiddenSearch(!adminHiddenSearch)}
                      className={`p-3 rounded-lg transition-colors ${
                        adminHiddenSearch 
                          ? 'bg-red-500/20 border border-red-500/50' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                      title="Toggle hidden search (COMA + slashed)"
                    >
                      <Eye size={18} className={adminHiddenSearch ? 'text-red-400' : 'text-white/40'} />
                    </button>
                  )}
                  
                  {/* QR Code Share Button */}
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="p-3 rounded-lg transition-colors bg-white/5 border border-white/10 hover:bg-white/10"
                    title="Share Your Profile QR"
                  >
                    <QrCode size={18} className="text-white/60" />
                  </button>
                  
                  {/* QR Scanner Button */}
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="p-3 rounded-lg transition-colors bg-white/5 border border-white/10 hover:bg-white/10"
                    title="Scan Profile QR"
                  >
                    <Camera size={18} className="text-white/60" />
                  </button>
                </div>

                {/* Filter Chips - Slide In When Search Focused */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSearchFilter('humans')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            searchFilter === 'humans'
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <User size={16} />
                          <span className="text-sm font-medium">Humans</span>
                        </button>
                        
                        <button
                          onClick={() => setSearchFilter('sounds')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            searchFilter === 'sounds'
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <Music size={16} />
                          <span className="text-sm font-medium">Sounds</span>
                        </button>
                        
                        <button
                          onClick={() => setSearchFilter('gigs')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            searchFilter === 'gigs'
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <Briefcase size={16} />
                          <span className="text-sm font-medium">Gigs</span>
                        </button>
                        
                        <button
                          onClick={() => setSearchFilter('tags')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            searchFilter === 'tags'
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <Hash size={16} />
                          <span className="text-sm font-medium">Tags</span>
                        </button>
                      </div>

                      {/* Volatile Tag Suggestions */}
                      {searchFilter === 'tags' && !searchQuery && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Volatile Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {volatileTags.slice(0, 6).map((tag) => (
                              <button
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                onMouseDown={() => handleTagLongPress(tag)}
                                onMouseUp={handleTagLongPressEnd}
                                onMouseLeave={handleTagLongPressEnd}
                                onTouchStart={() => handleTagLongPress(tag)}
                                onTouchEnd={handleTagLongPressEnd}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 border border-white/10 transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Results */}
                {isSearchFocused && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-h-96 overflow-y-auto bg-black/60 backdrop-blur-md rounded-lg border border-white/10"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        {/* Avatar/Icon */}
                        {result.type === 'human' && result.profile_photo_url ? (
                          <img
                            src={result.profile_photo_url}
                            alt={result.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            {result.type === 'human' && <User size={20} className="text-white/60" />}
                            {result.type === 'sound' && <Music size={20} className="text-white/60" />}
                            {result.type === 'tag' && <Hash size={20} className="text-white/60" />}
                            {result.type === 'gig' && <Briefcase size={20} className="text-white/60" />}
                          </div>
                        )}

                        {/* Result Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${result.is_coma ? 'text-white/40' : 'text-white'}`}>
                              {result.name}
                            </p>
                            {result.is_verified && (
                              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            {result.is_coma && (
                              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300">
                                COMA
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40">{result.subtitle}</p>
                          {result.count && (
                            <p className="text-xs text-white/60 font-mono">{result.count}</p>
                          )}
                          {result.talent_reward && (
                            <p className="text-xs text-green-400 font-medium">
                              💎 {result.talent_reward} Talents
                            </p>
                          )}
                          {result.coma_cost && result.coma_cost > 0 && (
                            <p className="text-xs text-yellow-400">
                              {result.coma_cost} Talents to interact
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Watch History (Bottom of Search) */}
                {isSearchFocused && !searchQuery && watchHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-3 border-t border-white/10"
                  >
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Recent History</p>
                    <div className="space-y-1">
                      {watchHistory.slice(0, 5).map((item) => (
                        <Link
                          key={item.id}
                          href={`/video/${item.video_id}`}
                          className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Clock size={14} className="text-white/40" />
                          <div className="flex-1">
                            <p className="text-xs text-white truncate">{item.sound_name}</p>
                            <p className="text-xs text-white/40 truncate">{item.artist_name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Admin Tag Slash Modal */}
            <AnimatePresence>
              {longPressTag && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setLongPressTag(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="bg-gradient-to-br from-red-900/50 to-black border border-red-500/50 rounded-xl p-6 max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-white font-bold mb-2">Slash Tag?</p>
                    <p className="text-white/60 text-sm mb-4">
                      Remove <span className="text-red-400">#{longPressTag}</span> from search suggestions?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSlashTag(longPressTag)}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
                      >
                        Slash Tag
                      </button>
                      <button
                        onClick={() => setLongPressTag(null)}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* QR Code Share Modal */}
            <AnimatePresence>
              {showQRCode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setShowQRCode(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-purple-900/50 to-black border border-purple-500/50 rounded-xl p-6 max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <QrCode size={24} className="text-purple-400" />
                      <p className="text-white font-bold text-lg">Your Profile QR</p>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Share this QR code to instantly connect with other humans
                    </p>
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <img 
                        src={getProfileQRCodeURL()} 
                        alt="Profile QR Code" 
                        className="w-full h-auto"
                      />
                    </div>
                    <button
                      onClick={() => setShowQRCode(false)}
                      className="w-full py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* QR Scanner Modal */}
            <AnimatePresence>
              {showQRScanner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setShowQRScanner(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-blue-900/50 to-black border border-blue-500/50 rounded-xl p-6 max-w-sm w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Camera size={24} className="text-blue-400" />
                      <p className="text-white font-bold text-lg">Scan Profile QR</p>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Point your camera at a profile QR code to instantly visit their profile
                    </p>
                    <div className="bg-black/50 rounded-lg p-8 mb-4 flex items-center justify-center">
                      <p className="text-white/40 text-center text-sm">
                        📷 Camera scanner coming soon<br/>
                        <span className="text-xs">Use device camera app to scan QR codes</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowQRScanner(false)}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Settings Modal */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setShowSettings(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Settings size={24} className="text-white" />
                        <h2 className="text-white font-bold text-lg">Settings</h2>
                      </div>
                      <button onClick={() => setShowSettings(false)}>
                        <X size={20} className="text-white/60 hover:text-white" />
                      </button>
                    </div>
                    
                    {/* Stranger View Toggle */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Stranger View</p>
                          <p className="text-white/60 text-xs mt-1">See your profile as others do</p>
                        </div>
                        <button
                          onClick={toggleViewAsStranger}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            viewAsStranger ? 'bg-purple-500' : 'bg-white/20'
                          }`}
                        >
                          <motion.div
                            animate={{ x: viewAsStranger ? 24 : 0 }}
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                          />
                        </button>
                      </div>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-3">Notifications</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/80 text-sm">Sound Notifications</span>
                          <div className="w-10 h-5 bg-white/20 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/80 text-sm">Message Alerts</span>
                          <div className="w-10 h-5 bg-white/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Privacy Settings */}
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-3">Privacy</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/80 text-sm">Profile Visibility</span>
                          <select className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-xs">
                            <option>Public</option>
                            <option>Connections Only</option>
                            <option>Private</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/80 text-sm">Show Online Status</span>
                          <div className="w-10 h-5 bg-white/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Account Actions */}
                    <div className="space-y-2">
                      <Link
                        href="/settings/account"
                        className="block w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm text-center transition-colors"
                      >
                        Account Settings
                      </Link>
                      <button className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 text-sm border border-red-500/30 transition-colors">
                        Deactivate Account
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Share Profile Modal */}
            <AnimatePresence>
              {showShareProfile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setShowShareProfile(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-purple-900/50 to-black border border-purple-500/50 rounded-xl p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <LinkIcon size={24} className="text-purple-400" />
                      <h2 className="text-white font-bold text-lg">Share Profile</h2>
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Share your 6713 profile link with others
                    </p>
                    
                    {/* Pretty Link */}
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-4">
                      <p className="text-white/40 text-xs mb-2">Your Profile Link</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-purple-400 text-sm font-mono break-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}/profile/${userId}` : ''}
                        </code>
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined' && userId) {
                              navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}`);
                              alert('Link copied!');
                            }
                          }}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                        >
                          <span className="text-purple-400 text-xs">Copy</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Share to Wall */}
                    <button
                      onClick={() => {
                        // TODO: Implement share to wall functionality
                        alert('Sharing to Wall coming soon!');
                        setShowShareProfile(false);
                      }}
                      className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium mb-2 transition-colors"
                    >
                      Share to Wall
                    </button>
                    
                    <button
                      onClick={() => setShowShareProfile(false)}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menu Items - Slide Down When Search Focused */}
            <motion.div
              animate={{
                y: isSearchFocused ? 20 : 0,
                opacity: isSearchFocused ? 0.5 : 1
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-0"
            >

            {/* View as Stranger Toggle */}
            <div className="p-4 border-b border-white/10">
              <button
                onClick={toggleViewAsStranger}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {viewAsStranger ? <Eye size={20} className="text-purple-400" /> : <EyeOff size={20} className="text-white/60" />}
                  <div className="text-left">
                    <p className="text-white font-medium">View as Stranger</p>
                    <p className="text-xs text-white/50">
                      {viewAsStranger ? 'Stranger mode active' : 'See your public view'}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${viewAsStranger ? 'bg-purple-500' : 'bg-white/20'}`}>
                  <motion.div
                    animate={{ x: viewAsStranger ? 24 : 0 }}
                    className="w-6 h-6 bg-white rounded-full shadow-lg"
                  />
                </div>
              </button>
            </div>

            {/* Talent Wallet */}
            <div className="p-4 border-b border-white/10">
              <button
                onClick={handleWalletClick}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 rounded-xl transition-colors border border-yellow-500/20"
              >
                <div className="flex items-center gap-3">
                  <Wallet size={20} className="text-yellow-400" />
                  <div className="text-left">
                    <p className="text-xs text-white/60 uppercase tracking-wider">Talent Balance</p>
                    <p className="text-xl font-bold text-white">{formatTalents(userStatus?.talent_balance || 0)} <span className="text-sm text-yellow-400">T</span></p>
                  </div>
                </div>
                <ChevronRight size={20} className={`text-white/60 transition-transform ${showWalletDropdown ? 'rotate-90' : ''}`} />
              </button>

              {/* Wallet Dropdown */}
              <AnimatePresence>
                {showWalletDropdown && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-3 space-y-2">
                      {/* Quick Actions */}
                      <Link
                        href="/money"
                        className="flex items-center gap-2 p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
                      >
                        <DollarSign size={18} className="text-green-400" />
                        <span className="text-white font-medium">Reload Talents</span>
                      </Link>

                      {/* Transaction History Header */}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-white/60 uppercase tracking-wider">Recent Activity</p>
                        {loadingTransactions && (
                          <RefreshCw size={12} className="text-white/40 animate-spin" />
                        )}
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {transactions.length === 0 ? (
                          <p className="text-xs text-white/40 text-center py-4">No transactions yet</p>
                        ) : (
                          transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-xs text-white">{tx.description}</p>
                                <p className="text-xs text-white/40">{formatDate(tx.created_at)}</p>
                              </div>
                              <p className={`text-sm font-bold ${tx.type === 'earn' || tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.type === 'spend' ? '-' : '+'}{formatTalents(tx.amount)} T
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Indicators */}
            <div className="p-4 border-b border-white/10">
              <div className="space-y-3">
                {/* CPR Count */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-sm text-white/80">CPR Count</span>
                  </div>
                  <span className="text-white font-bold">{userStatus?.cpr_count || 0}/13</span>
                </div>

                {/* COMA Status */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${userStatus?.is_coma ? 'bg-red-400' : 'bg-green-400'}`} />
                    <span className="text-sm text-white/80">Status</span>
                  </div>
                  <span className={`text-sm font-bold ${userStatus?.is_coma ? 'text-red-400' : 'text-green-400'}`}>
                    {userStatus?.is_coma ? 'COMA' : 'Active'}
                  </span>
                </div>

                {/* Verification Status */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${userStatus?.verification_status === 'verified' ? 'bg-purple-400' : 'bg-yellow-400'}`} />
                    <span className="text-sm text-white/80">Verification</span>
                  </div>
                  <span className="text-xs text-white/60 capitalize">{userStatus?.verification_status || 'pending'}</span>
                </div>
              </div>
            </div>

            {/* Mod/Admin Ghost Menu */}
            {(userStatus?.is_mod || userStatus?.is_admin) && (
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={() => setShowModMenu(!showModMenu)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-600/20 to-purple-600/20 hover:from-red-600/30 hover:to-purple-600/30 rounded-xl transition-colors border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-red-400" />
                    <div className="text-left">
                      <p className="text-white font-bold">God Mode</p>
                      <p className="text-xs text-white/50">Moderator Controls</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-white/60 transition-transform ${showModMenu ? 'rotate-90' : ''}`} />
                </button>

                {/* Mod Menu Dropdown */}
                <AnimatePresence>
                  {showModMenu && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-red-500/20 p-3 space-y-2">
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Shield size={16} className="text-red-400" />
                          <span className="text-white text-sm">Admin Dashboard</span>
                        </Link>

                        <Link
                          href="/admin/tickets"
                          className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Clock size={16} className="text-orange-400" />
                          <span className="text-white text-sm">Open Tickets</span>
                        </Link>

                        <button
                          className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          onClick={() => {
                            // Toggle global slow mode
                            console.log('Toggle slow mode');
                          }}
                        >
                          <RefreshCw size={16} className="text-blue-400" />
                          <span className="text-white text-sm">Global Toggles</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Navigation Links */}
            <div className="p-4 space-y-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white">Settings</span>
              </Link>

              <Link
                href="/wall"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white">Public Wall</span>
              </Link>

              <Link
                href="/live"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white">Live Radio</span>
              </Link>

              <Link
                href="/hue"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white">Hue Feed</span>
              </Link>
            </div>

            {/* Footer Icons: Link & Settings (Side-by-Side) */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShareProfile(true)}
                  className="flex-1 flex flex-col items-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/30 transition-colors"
                >
                  <LinkIcon size={24} className="text-purple-400" />
                  <span className="text-white text-sm font-medium">Share Profile</span>
                </button>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                >
                  <Settings size={24} className="text-white/60" />
                  <span className="text-white text-sm font-medium">Settings</span>
                </button>
              </div>
            </div>

            {/* App Version */}
            <div className="p-4 text-center">
              <p className="text-xs text-white/30">6713 Protocol v1.0.0</p>
              <p className="text-xs text-white/20 mt-1">The Frequency</p>
            </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
