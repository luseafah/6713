'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VerificationStatus {
  isVerified: boolean;
  loading: boolean;
  userId: string | null;
}

/**
 * Hook to check user verification status
 * Returns verification state and loading status
 */
export function useVerificationStatus(): VerificationStatus {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkVerification();

    // Subscribe to profile changes
    const channel = supabase
      .channel('verification-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload: any) => {
        if (payload.new.id === userId && payload.new.verified_at) {
          setIsVerified(true);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const checkVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_at, is_verified')
        .eq('id', user.id)
        .single();

      setIsVerified(!!(profile?.verified_at || profile?.is_verified));
    } catch (error) {
      console.error('Error checking verification:', error);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  return { isVerified, loading, userId };
}
