'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import SideNav from './TopBar';
import FixedHeader from './FixedHeader';
import UnverifiedGate from './UnverifiedGate';
import { AnimatePresence } from 'framer-motion';

interface AppWrapperProps {
  children: React.ReactNode;
  onNavigate?: (section: string) => void;
  currentTab?: string;
}

export default function AppWrapper({ children, onNavigate, currentTab }: AppWrapperProps) {
  const [userProfile, setUserProfile] = useState<Profile | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [gateFeature, setGateFeature] = useState<'hue' | 'live' | 'menu' | 'post' | 'profile' | 'dm'>('hue');
  const [adminView, setAdminView] = useState(false);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        setUserId(user.id);

        // Fetch user profile
        const response = await fetch(`/api/profile?user_id=${user.id}`);
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleUpload = () => {
    if (!userProfile?.verified_at) {
      setGateFeature('post');
      setShowGate(true);
      return;
    }
    console.log('Upload clicked');
    alert('Upload flow coming soon!');
  };

  const handleMenuClick = () => {
    // Unlock for Pope AI in admin mode
    if (isPopeAI && isAdmin && adminView) {
      setIsMenuOpen(true);
      return;
    }
    if (!userProfile?.verified_at && currentTab !== 'wall' && currentTab !== 'messages') {
      setGateFeature('menu');
      setShowGate(true);
      return;
    }
    setIsMenuOpen(true);
  };

  const handleNavigate = (section: string) => {
    // Unlock for Pope AI in admin mode
    if (isPopeAI && isAdmin && adminView) {
      onNavigate?.(section);
      setIsMenuOpen(false);
      return;
    }
    // Check if unverified user trying to access locked tabs
    if (!userProfile?.verified_at) {
      const lockedTabs = ['hue', 'live', 'money', 'settings'];
      if (lockedTabs.includes(section)) {
        setGateFeature(section as any);
        setShowGate(true);
        setIsMenuOpen(false);
        return;
      }
    }
    onNavigate?.(section);
    setIsMenuOpen(false);
  };

  // Pope AI account check
  const isPopeAI = userProfile?.id === '3e52b8f6-ee91-4d7a-9f0e-208bafc23810';
  const isAdmin = !!userProfile?.is_admin;

  return (
    <>
      <FixedHeader 
        onMenuClick={handleMenuClick}
        onUploadClick={handleUpload}
        isVerified={userProfile?.verified_at !== null}
      />
      <SettingsModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        comaStatus={userProfile?.coma_status ?? false}
        onComaToggle={() => {}}
        username={userProfile?.username ?? ''}
        isVerified={!!userProfile?.verified_at}
        role={userProfile?.role ?? ''}
        talentBalance={userProfile?.talent_balance ?? 0}
        isAdmin={isAdmin}
        isPopeAI={isPopeAI}
        adminView={adminView}
        onToggleAdminView={() => setAdminView((v) => !v)}
      />
      <SideNav 
        userProfile={userProfile} 
        onNavigate={handleNavigate}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        adminView={adminView}
        isAdmin={isAdmin}
        isPopeAI={isPopeAI}
      />
      <div className="pt-16">
        {/* Pass adminView to children via context or props as needed */}
        {children}
      </div>

      {/* Unverified Gate Modal */}
      <AnimatePresence>
        {showGate && (
          <UnverifiedGate 
            feature={gateFeature}
            variant="overlay"
          />
        )}
      </AnimatePresence>
    </>
  );
}
