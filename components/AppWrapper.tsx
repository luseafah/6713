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
    if (!userProfile?.verified_at && currentTab !== 'wall' && currentTab !== 'messages') {
      setGateFeature('menu');
      setShowGate(true);
      return;
    }
    setIsMenuOpen(true);
  };

  const handleNavigate = (section: string) => {
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

  return (
    <>
      <FixedHeader 
        onMenuClick={handleMenuClick}
        onUploadClick={handleUpload}
        isVerified={userProfile?.verified_at !== null}
      />
      <SideNav 
        userProfile={userProfile} 
        onNavigate={handleNavigate}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="pt-16">
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
