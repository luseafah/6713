'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Ghost, LayoutGrid, Radio, TrendingUp, LogOut, Settings, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '@/types/database';

interface SideNavProps {
  userProfile?: Profile;
  onNavigate?: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNav({ userProfile, onNavigate, isOpen, onClose }: SideNavProps) {
  const [glazeActive, setGlazeActive] = useState(false);

  // Sync Glaze Protocol from Database
  useEffect(() => {
    const fetchGlaze = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'glaze_active')
        .single();
      
      if (data) setGlazeActive(data.setting_value);
    };
    
    fetchGlaze();
    
    // Poll for glaze status changes
    const interval = setInterval(fetchGlaze, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (section: string) => {
    if (onNavigate) onNavigate(section);
    onClose(); // Close menu after navigation
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Dark Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
          />
        )}
      </AnimatePresence>

      {/* The Left Collapsible Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 h-full w-72 bg-neutral-950 z-[80] border-r border-white/10 ${
              glazeActive ? 'ring-2 ring-purple-500/30' : ''
            }`}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              aria-label="Close Menu"
            >
              <X size={24} />
            </motion.button>

            <div className="flex flex-col h-full p-8 overflow-y-auto">
              {/* Brand Header */}
              <div className="mb-12">
                <h1 className="text-3xl font-black italic tracking-tighter text-white">
                  6713
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                  {glazeActive ? 'Glaze Protocol Active' : 'Protocol Active'}
                </p>
              </div>

              {/* Navigation Icons & Links */}
              <nav className="flex flex-col gap-6 flex-grow">
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('hue')}
                  className="flex items-center gap-4 text-white group"
                >
                  <Ghost size={20} className="text-white group-hover:text-green-500 transition-colors" />
                  <span className="font-bold uppercase tracking-widest text-sm">Hue</span>
                </motion.button>

                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('wall')}
                  className="flex items-center gap-4 text-white/40 hover:text-white group transition-colors"
                >
                  <LayoutGrid size={20} className="group-hover:text-white transition-colors" />
                  <span className="font-bold uppercase tracking-widest text-sm group-hover:text-white">
                    Wall
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('live')}
                  className="flex items-center gap-4 text-white/40 hover:text-white group transition-colors"
                >
                  <Radio size={20} className="group-hover:text-white transition-colors" />
                  <span className="font-bold uppercase tracking-widest text-sm group-hover:text-white">
                    Live
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('money')}
                  className="flex items-center gap-4 text-green-500 group"
                >
                  <TrendingUp size={20} />
                  <span className="font-bold uppercase tracking-widest text-sm">$$$4U</span>
                </motion.button>

                {/* Divider */}
                <div className="h-px bg-white/5 my-4" />

                {/* Additional Actions */}
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('messages')}
                  className="flex items-center gap-4 text-white/40 hover:text-white group transition-colors"
                >
                  <MessageCircle size={20} className="group-hover:text-white transition-colors" />
                  <span className="font-bold uppercase tracking-widest text-sm group-hover:text-white">
                    Messages
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigate('settings')}
                  className="flex items-center gap-4 text-white/40 hover:text-white group transition-colors"
                >
                  <Settings size={20} className="group-hover:text-white transition-colors" />
                  <span className="font-bold uppercase tracking-widest text-sm group-hover:text-white">
                    Settings
                  </span>
                </motion.button>
              </nav>

              {/* Bottom Actions: Upload & Wallet */}
              <div className="mt-auto flex flex-col gap-4 border-t border-white/5 pt-8">
                {/* Wallet Display */}
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] text-white/40 font-mono">WALLET</span>
                  <span className="text-sm font-mono font-bold text-green-400">
                    {userProfile?.talent_balance || 0} T
                  </span>
                </div>

                {/* User COMA Status */}
                {userProfile?.coma_status && (
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] text-purple-400 font-bold uppercase">
                      COMA Active
                    </span>
                  </div>
                )}

                {/* Sign Out */}
                <motion.button
                  whileHover={{ x: 5 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-white/20 hover:text-red-500 text-[10px] font-bold uppercase mt-4 transition-colors"
                >
                  <LogOut size={14} /> De-Sync Session
                </motion.button>

                {/* Glaze Protocol Indicator */}
                {glazeActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-2 bg-purple-900/30 border border-purple-500/50 rounded text-center"
                  >
                    <p className="text-[10px] text-purple-400 font-bold animate-pulse">
                      ✨ GLAZE ACTIVE ✨
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
