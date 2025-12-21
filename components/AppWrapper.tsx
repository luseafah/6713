'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import SideNav from './TopBar';
import FixedHeader from './FixedHeader';

interface AppWrapperProps {
  children: React.ReactNode;
  onNavigate?: (section: string) => void;
}

export default function AppWrapper({ children, onNavigate }: AppWrapperProps) {
  const [userProfile, setUserProfile] = useState<Profile | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    // TODO: Implement upload modal/flow
    console.log('Upload clicked');
    alert('Upload flow coming soon!');
  };

  return (
    <>
      <FixedHeader 
        onMenuClick={() => setIsMenuOpen(true)}
        onUploadClick={handleUpload}
        isVerified={userProfile?.verified_at !== null}
      />
      <SideNav 
        userProfile={userProfile} 
        onNavigate={onNavigate}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}
