'use client';

import { useState } from 'react';
import ComaSettings from '@/components/ComaSettings';
import GlazeSettings from '@/components/GlazeSettings';
import AppWrapper from '@/components/AppWrapper';
import GigsModal from '@/components/GigsModal';
import { Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [showGigsModal, setShowGigsModal] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [talentBalance, setTalentBalance] = useState<number>(0);

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  const handleOpenGigs = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Please log in to manage gigs');
        return;
      }

      // Get talent balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('talent_balance')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        alert('Could not load your profile');
        return;
      }

      setUserId(user.id);
      setTalentBalance(profile.talent_balance || 0);
      setShowGigsModal(true);
    } catch (error) {
      console.error('Error opening gigs:', error);
      alert('Failed to open gigs');
    }
  };

  const handleGigPosted = async () => {
    // Refresh talent balance after posting
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('talent_balance')
        .eq('id', user.id)
        .single();

      if (profile) {
        setTalentBalance(profile.talent_balance || 0);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  return (
    <main className="bg-black min-h-screen">
      <AppWrapper onNavigate={handleNavigate}>
        <div className="px-4 py-8 pb-12 min-h-screen">
          <h1 className="text-white text-3xl font-bold mb-8">Settings</h1>
          
          {/* Gig Protocol Section */}
          <div className="bg-gradient-to-br from-purple-900/20 to-black border-2 border-purple-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Gig Protocol</h2>
                </div>
                <p className="text-white/60 text-sm">
                  Post high-value opportunities for 10 Talents
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenGigs}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all"
            >
              Manage Your Gigs
            </button>

            <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-white/70 text-xs leading-relaxed">
                <span className="font-semibold text-purple-400">5 Gig Slots Max.</span> Each gig costs 10 Talents and appears in the Hue feed. 
                Enable <span className="font-semibold text-yellow-400">BUDGE</span> for a yellow border (flickers red with active Story).
              </p>
            </div>
          </div>

          {/* Admin-only Glaze Protocol */}
          <GlazeSettings />
          
          {/* COMA Settings */}
          <ComaSettings />
        </div>
      </AppWrapper>

      {showGigsModal && (
        <GigsModal
          onClose={() => setShowGigsModal(false)}
          userId={userId}
          talentBalance={talentBalance}
          onGigPosted={handleGigPosted}
        />
      )}
    </main>
  );
}

