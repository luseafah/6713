'use client';

import { useEffect, useState } from 'react';
import VoidScreen from '@/components/VoidScreen';
import { Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface DeactivationCheckProps {
  children: React.ReactNode;
}

export default function DeactivationCheck({ children }: DeactivationCheckProps) {
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inVoid, setInVoid] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      checkDeactivation();
    }
  }, [userId]);

  const checkDeactivation = async () => {
    try {
      const response = await fetch(`/api/profile?user_id=${userId}`);
      const data = await response.json();
      
      setProfile(data);

      // Check if deactivated and within 72 hours
      if (data.deactivated_at) {
        const deactivatedTime = new Date(data.deactivated_at).getTime();
        const hoursSinceDeactivation = (Date.now() - deactivatedTime) / (1000 * 60 * 60);

        if (hoursSinceDeactivation <= 72) {
          setInVoid(true);
        }
      }
    } catch (error) {
      console.error('Failed to check deactivation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (inVoid && profile) {
    return <VoidScreen userId={userId} profile={profile} />;
  }

  return <>{children}</>;
}
