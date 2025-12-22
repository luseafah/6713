'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Edit,
  DollarSign,
  Heart,
  Users,
  Briefcase,
  BookOpen,
  Crown,
  Slash,
  Clock,
  AlertCircle,
  Ban,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

// =====================================================
// TYPES
// =====================================================

interface ProfileUser {
  user_id: string;
  username: string;
  talent_balance: number;
  is_coma: boolean;
  coma_cost: number;
  is_admin: boolean;
  is_mod: boolean;
  profile_photo_url?: string;
  verified_name?: string;
  is_verified: boolean;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

interface AnchorPost {
  anchor_post_id: string;
  image_url: string;
  caption?: string;
  sound_id?: string;
  sound_name?: string;
  sound_start_time: number;
  swap_count: number;
  is_slashed: boolean;
}

interface PinnedContent {
  pinned_id: string;
  content_type: 'video' | 'photo' | 'audio';
  tier: number;
  position: number;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  sound_name?: string;
  duration_seconds?: number;
  waveform_data?: any;
  is_slashed: boolean;
}

interface ProfileStats {
  likes: number;
  likes_display: string;
  huemans: number;
  huemans_display: string;
  connections: number;
  is_connected: boolean;
}

interface ActiveVisitor {
  visit_id: string;
  visitor_user_id?: string;
  visitor_username?: string;
  visitor_profile_photo?: string;
  dwell_seconds: number;
  is_incognito: boolean;
  started_at: string;
}

interface CPRStatus {
  current: number;
  max: number;
  is_active: boolean;
  expires_at?: string;
  completed_at?: string;
}

// =====================================================
// PROFILE PAGE COMPONENT
// =====================================================

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const username = params.username as string;
  
  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [anchorPost, setAnchorPost] = useState<AnchorPost | null>(null);
  const [pinnedContent, setPinnedContent] = useState<PinnedContent[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [cprStatus, setCprStatus] = useState<CPRStatus | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [dwellSeconds, setDwellSeconds] = useState(0);
  
  // UI State
  const [isStrangerView, setIsStrangerView] = useState(false);
  const [show4thWallModal, setShow4thWallModal] = useState(false);
  const [showCutModal, setShowCutModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [fourthWallMessage, setFourthWallMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const isOwnProfile = currentUser?.user_id === profileUser?.user_id;
  const isAdmin = currentUser?.is_admin || currentUser?.is_mod;
  
  // =====================================================
  // LOAD DATA
  // =====================================================
  
  useEffect(() => {
    loadProfile();
  }, [username]);
  
  useEffect(() => {
    if (!profileUser) return;
    
    // Start profile visit tracking
    startVisit();
    
    // Set up dwell time tracking
    const interval = setInterval(() => {
      setDwellSeconds((prev) => prev + 1);
      if (visitId) {
        supabase.rpc('update_profile_visit', {
          p_visit_id: visitId,
          p_additional_seconds: 1,
        });
      }
    }, 1000);
    
    // Load active visitors every 5 seconds (for QT Blimp)
    loadActiveVisitors();
    const visitorsInterval = setInterval(loadActiveVisitors, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(visitorsInterval);
      endVisit();
    };
  }, [profileUser, visitId]);
  
  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(userData);
      }
      
      // Get profile user
      const { data: profileData } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          talent_balance,
          is_coma,
          coma_cost,
          is_admin,
          is_mod,
          profiles (
            profile_photo_url,
            verified_name,
            first_name,
            last_name,
            bio
          )
        `)
        .eq('username', username)
        .single();
      
      if (!profileData) {
        router.push('/');
        return;
      }
      
      setProfileUser({
        ...profileData,
        profile_photo_url: profileData.profiles?.[0]?.profile_photo_url,
        verified_name: profileData.profiles?.[0]?.verified_name,
        first_name: profileData.profiles?.[0]?.first_name,
        last_name: profileData.profiles?.[0]?.last_name,
        bio: profileData.profiles?.[0]?.bio,
        is_verified: !!profileData.profiles?.[0]?.verified_name,
      });
      
      // Load anchor post
      const { data: anchor } = await supabase.rpc('get_anchor_post', {
        p_user_id: profileData.user_id,
      });
      if (anchor?.[0]) setAnchorPost(anchor[0]);
      
      // Load pinned content
      const { data: pinned } = await supabase.rpc('get_pinned_content', {
        p_user_id: profileData.user_id,
      });
      if (pinned) setPinnedContent(pinned);
      
      // Load stats
      const { data: statsData } = await supabase.rpc('get_profile_stats', {
        p_profile_user_id: profileData.user_id,
        p_viewer_user_id: user?.id || null,
        p_is_stranger_view: isStrangerView,
      });
      if (statsData) setStats(statsData);
      
      // Load CPR status if own profile
      if (user?.id === profileData.user_id) {
        const { data: cprData } = await supabase.rpc('get_cpr_status', {
          p_user_id: profileData.user_id,
        });
        if (cprData) setCprStatus(cprData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };
  
  const startVisit = async () => {
    if (!profileUser) return;
    
    const { data } = await supabase.rpc('start_profile_visit', {
      p_profile_user_id: profileUser.user_id,
      p_visitor_user_id: currentUser?.user_id || null,
      p_is_incognito: isStrangerView,
    });
    
    if (data) setVisitId(data);
  };
  
  const endVisit = async () => {
    if (!visitId) return;
    
    await supabase.rpc('end_profile_visit', {
      p_visit_id: visitId,
    });
  };
  
  const loadActiveVisitors = async () => {
    if (!profileUser || !isOwnProfile) return;
    
    const { data } = await supabase.rpc('get_active_visitors', {
      p_user_id: profileUser.user_id,
    });
    
    if (data) setActiveVisitors(data);
  };
  
  // =====================================================
  // ACTIONS
  // =====================================================
  
  const handleBreak4thWall = async () => {
    if (!fourthWallMessage.trim() || !profileUser) return;
    
    const { data } = await supabase.rpc('break_fourth_wall', {
      p_sender_id: currentUser.user_id,
      p_recipient_id: profileUser.user_id,
      p_message_text: fourthWallMessage,
    });
    
    if (data?.success) {
      alert(`4th Wall Broken! ${data.talents_spent} Talents spent. New balance: ${data.new_balance}`);
      setShow4thWallModal(false);
      setFourthWallMessage('');
      // Reload current user data
      loadProfile();
    } else {
      alert(data?.error || 'Failed to break 4th wall');
    }
  };
  
  const handleCutConnection = async () => {
    if (!profileUser) return;
    
    const { data } = await supabase.rpc('cut_connection', {
      p_cutter_id: currentUser.user_id,
      p_cut_user_id: profileUser.user_id,
    });
    
    if (data?.success) {
      alert(`Connection cut. Snitch Alert: Total QT revealed to ${profileUser.username}: ${data.qt_display} seconds`);
      setShowCutModal(false);
      router.push('/hue');
    }
  };
  
  const handleAdminSlash = async (contentType: 'anchor' | 'pinned', contentId: string) => {
    const reason = prompt('Slash reason (optional):');
    
    const { data } = await supabase.rpc('admin_slash_content', {
      p_admin_user_id: currentUser.user_id,
      p_content_type: contentType,
      p_content_id: contentId,
      p_slash_reason: reason,
    });
    
    if (data?.success) {
      alert('Content slashed');
      loadProfile();
    }
  };
  
  const handleAdminInjectTalents = async () => {
    if (!profileUser) return;
    
    const amountStr = prompt('Talent amount (positive to add, negative to subtract):');
    if (!amountStr) return;
    
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return;
    
    const reason = prompt('Reason (optional):');
    
    const { data } = await supabase.rpc('admin_inject_talents', {
      p_admin_user_id: currentUser.user_id,
      p_target_user_id: profileUser.user_id,
      p_talent_amount: amount,
      p_reason: reason,
    });
    
    if (data?.success) {
      alert(`Talents adjusted. New balance: ${data.new_balance}`);
      loadProfile();
    }
  };
  
  // =====================================================
  // RENDER
  // =====================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading profile...</div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Profile not found</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black pb-20">
      {/* =====================================================
          IDENTITY HEADER
          ===================================================== */}
      <div className="relative bg-gradient-to-b from-purple-900/20 to-black p-6">
        {/* Admin Crown */}
        {isAdmin && !isOwnProfile && (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="absolute top-4 right-4 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg"
          >
            <Crown size={20} className="text-yellow-400" />
          </button>
        )}
        
        {/* Avatar & Status */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={profileUser.profile_photo_url || '/default-avatar.png'}
              alt={profileUser.username}
              className={`w-24 h-24 rounded-full object-cover ${
                profileUser.is_coma ? 'grayscale' : ''
              }`}
            />
            {profileUser.is_coma && (
              <div className="absolute inset-0 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold">COMA</span>
              </div>
            )}
            {profileUser.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {profileUser.verified_name || profileUser.username}
              </h1>
            </div>
            <p className="text-white/60">@{profileUser.username}</p>
            {profileUser.bio && (
              <p className="text-white/80 text-sm mt-2">{profileUser.bio}</p>
            )}
            
            {/* Stats */}
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Heart size={16} className="text-red-400" />
                <span className="text-white font-medium">{stats?.likes_display}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} className="text-purple-400" />
                <span className="text-white font-medium">{stats?.huemans_display}</span>
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-1">
                  <DollarSign size={16} className="text-green-400" />
                  <span 
                    className="text-white font-medium cursor-pointer"
                    onClick={isAdmin ? handleAdminInjectTalents : undefined}
                  >
                    {profileUser.talent_balance}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* QT Blimp */}
        {isOwnProfile && activeVisitors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-purple-500/50 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-purple-400" />
              <span className="text-white text-sm font-medium">
                {activeVisitors.length} viewing
              </span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {activeVisitors.map((v) => (
                <div key={v.visit_id} className="flex items-center gap-1">
                  <span className={v.is_incognito ? 'text-purple-400' : 'text-white/60'}>
                    {v.visitor_username || 'Anonymous'} ({v.dwell_seconds}s)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* CPR Counter */}
        {isOwnProfile && cprStatus?.is_active && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm font-medium">CPR Progress</span>
              <span className="text-white font-bold">{cprStatus.current}/{cprStatus.max}</span>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {!isOwnProfile && profileUser.is_coma && (
            <button
              onClick={() => setShow4thWallModal(true)}
              className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Break 4th Wall (100 💎)
            </button>
          )}
          
          {!isOwnProfile && stats?.is_connected && (
            <button
              onClick={() => setShowCutModal(true)}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            >
              <Ban size={16} />
              Cut Connection
            </button>
          )}
          
          {isOwnProfile && !isStrangerView && (
            <button
              onClick={() => setIsStrangerView(true)}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium"
            >
              View as Stranger
            </button>
          )}
          
          {isOwnProfile && isStrangerView && (
            <button
              onClick={() => {
                setIsStrangerView(false);
                loadProfile();
              }}
              className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium"
            >
              Exit Stranger View
            </button>
          )}
        </div>
      </div>
      
      {/* =====================================================
          ADMIN GOD-MODE PANEL
          ===================================================== */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-500/10 border-y border-yellow-500/30 p-4 overflow-hidden"
          >
            <p className="text-yellow-400 font-bold mb-2">👑 Admin God-Mode</p>
            <div className="flex gap-2">
              <button
                onClick={handleAdminInjectTalents}
                className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm"
              >
                Inject Talents
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* =====================================================
          THE ANCHOR (1 Permanent Photo Post)
          ===================================================== */}
      {anchorPost && (
        <div className="p-4">
          <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="relative">
              <img
                src={anchorPost.image_url}
                alt="Anchor Post"
                className={`w-full aspect-square object-cover ${
                  anchorPost.is_slashed ? 'opacity-50' : ''
                }`}
              />
              {anchorPost.is_slashed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500/80 px-4 py-2 rounded-lg">
                    <span className="text-white font-bold line-through decoration-4">SLASHED</span>
                  </div>
                </div>
              )}
              
              {/* Admin Slash Button */}
              {isAdmin && !isOwnProfile && (
                <button
                  onClick={() => handleAdminSlash('anchor', anchorPost.anchor_post_id)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg"
                >
                  <Slash size={16} className="text-white" />
                </button>
              )}
              
              {/* Edit Button (own profile only) */}
              {isOwnProfile && !isStrangerView && (
                <button className="absolute bottom-2 right-2 p-2 bg-black/80 rounded-lg">
                  <Edit size={16} className="text-white" />
                </button>
              )}
            </div>
            
            {anchorPost.caption && (
              <div className="p-4">
                <p className="text-white">{anchorPost.caption}</p>
              </div>
            )}
            
            {anchorPost.sound_name && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-purple-400">
                  <span>🎵 {anchorPost.sound_name}</span>
                </div>
              </div>
            )}
            
            {isOwnProfile && (
              <div className="px-4 pb-4 text-xs text-white/40">
                Swaps: {anchorPost.swap_count} • 10 💎 to replace
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* =====================================================
          3-TIER GRID
          ===================================================== */}
      <div className="p-4 space-y-6">
        {/* Tier 1: 3 Pinned Videos/Photos */}
        <div>
          <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <span>Pinned</span>
            {isOwnProfile && !isStrangerView && (
              <button className="p-1 bg-white/10 rounded">
                <Edit size={14} />
              </button>
            )}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((pos) => {
              const content = pinnedContent.find((c) => c.tier === 1 && c.position === pos);
              return (
                <div
                  key={`tier1-${pos}`}
                  className="aspect-square bg-white/5 rounded-lg overflow-hidden relative"
                >
                  {content ? (
                    <>
                      <img
                        src={content.thumbnail_url || content.media_url}
                        alt="Pinned"
                        className={`w-full h-full object-cover ${
                          content.is_slashed ? 'opacity-50' : ''
                        }`}
                      />
                      {content.is_slashed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Slash size={24} className="text-red-500" />
                        </div>
                      )}
                      {isAdmin && !isOwnProfile && (
                        <button
                          onClick={() => handleAdminSlash('pinned', content.pinned_id)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 rounded"
                        >
                          <Slash size={12} className="text-white" />
                        </button>
                      )}
                    </>
                  ) : (
                    isOwnProfile && !isStrangerView && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Edit size={20} className="text-white/40" />
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tier 2: 3 Audio Waveforms */}
        <div>
          <h2 className="text-white font-bold mb-3">Audio</h2>
          <div className="space-y-2">
            {[1, 2, 3].map((pos) => {
              const content = pinnedContent.find((c) => c.tier === 2 && c.position === pos);
              return (
                <div
                  key={`tier2-${pos}`}
                  className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                >
                  {content ? (
                    <>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎵</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{content.sound_name || 'Audio Snippet'}</p>
                        <p className="text-white/60 text-sm">{content.duration_seconds}s</p>
                      </div>
                      {isAdmin && !isOwnProfile && (
                        <button
                          onClick={() => handleAdminSlash('pinned', content.pinned_id)}
                          className="p-2 bg-red-500/20 rounded"
                        >
                          <Slash size={14} className="text-red-400" />
                        </button>
                      )}
                    </>
                  ) : (
                    isOwnProfile && !isStrangerView && (
                      <div className="flex-1 flex items-center justify-center text-white/40">
                        <Edit size={16} />
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tier 3: Gigs & Wiki Tabs */}
        <div>
          <div className="flex gap-2 mb-3">
            <Link
              href={`/gigs/${profileUser.username}`}
              className="flex-1 py-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-medium flex items-center justify-center gap-2"
            >
              <Briefcase size={18} />
              Gigs
            </Link>
            <Link
              href={`/wiki/${profileUser.username}`}
              className="flex-1 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 font-medium flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              Wiki
            </Link>
          </div>
        </div>
      </div>
      
      {/* =====================================================
          MODALS
          ===================================================== */}
      
      {/* 4th Wall Break Modal */}
      <AnimatePresence>
        {show4thWallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShow4thWallModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-red-900/50 to-black border border-red-500/50 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-red-400" />
                <h2 className="text-white font-bold text-lg">Break the 4th Wall</h2>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Send a message to {profileUser.username} (in COMA) for 100 Talents
              </p>
              <textarea
                value={fourthWallMessage}
                onChange={(e) => setFourthWallMessage(e.target.value)}
                placeholder="Your message..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/40 resize-none h-32 focus:outline-none focus:border-red-500/50"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleBreak4thWall}
                  disabled={!fourthWallMessage.trim()}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send (100 💎)
                </button>
                <button
                  onClick={() => setShow4thWallModal(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cut Connection Modal */}
      <AnimatePresence>
        {showCutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-yellow-900/50 to-black border border-yellow-500/50 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-yellow-400" />
                <h2 className="text-white font-bold text-lg">Snitch Alert</h2>
              </div>
              <p className="text-white/80 text-sm mb-4">
                Are you sure you want to cut your connection with <span className="font-bold">@{profileUser.username}</span>?
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ The Snitch Protocol will reveal your total QT (Quality Time) to them, including negative values.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCutConnection}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium"
                >
                  Cut Connection
                </button>
                <button
                  onClick={() => setShowCutModal(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
