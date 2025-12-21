'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthPage from './AuthPage';

interface AuthGatekeeperProps {
  children: React.ReactNode;
}

/**
 * 6713 Protocol: The Air-Lock
 * 
 * STRICTLY blocks access to ALL app features until:
 * - User has successfully signed up or logged in
 * - Session is verified and active
 * 
 * No exceptions. No bypasses. Authentication is mandatory.
 */
export default function AuthGatekeeper({ children }: AuthGatekeeperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚨 PROTOCOL ENFORCEMENT: No development bypass
    // All users MUST authenticate to access the protocol
    
    // Check current session immediately
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state:', event, session?.user?.id ? 'AUTHENTICATED' : 'LOCKED');
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔒 Session check failed - Air-Lock engaged:', error.message);
        setUser(null);
      } else if (session?.user) {
        console.log('✅ Session verified - Air-Lock open for:', session.user.id);
        setUser(session.user);
      } else {
        console.log('🔒 No session - Air-Lock engaged');
        setUser(null);
      }
    } catch (error) {
      console.error('🚨 Fatal session error - Air-Lock engaged:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Force loading to false after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Session check timed out - Air-Lock engaged (safety protocol)');
        setLoading(false);
        setUser(null);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Show loading state (Protocol Initialization)
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white/80 text-6xl font-bold tracking-wider">
            6713
          </div>
          <div className="text-white/40 text-sm uppercase tracking-[0.3em] animate-pulse">
            Initializing Air-Lock...
          </div>
        </div>
      </div>
    );
  }

  // 🔒 AIR-LOCK ENGAGED: Show Protocol Entry screen if no user
  if (!user) {
    return <AuthPage />;
  }

  // ✅ AIR-LOCK OPEN: User is authenticated, grant protocol access
  return <>{children}</>;
}
