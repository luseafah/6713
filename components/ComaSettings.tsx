'use client';

import { useState, useEffect } from 'react';
import { Power, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ComaSettings() {
  const [userId, setUserId] = useState<string>('');
  const [comaStatus, setComaStatus] = useState(false);
  const [refills, setRefills] = useState(3);
  const [talentBalance, setTalentBalance] = useState(100);
  const [cooldownHours, setCooldownHours] = useState(0);
  const [canEnter, setCanEnter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

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
      loadComaStatus();
      const interval = setInterval(loadComaStatus, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadComaStatus = async () => {
    try {
      const response = await fetch(`/api/coma/status?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setComaStatus(data.coma_status);
        setRefills(data.coma_refills);
        setTalentBalance(data.talent_balance);
        setCooldownHours(data.cooldown_hours);
        setCanEnter(data.can_enter_coma);
      }
    } catch (error) {
      console.error('Failed to load COMA status:', error);
    }
  };

  const handleEnterComa = async (reason: 'Choice' | 'Quest') => {
    setLoading(true);
    try {
      const response = await fetch('/api/coma/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        setComaStatus(true);
        setRefills(data.refills);
        setTalentBalance(data.talent_balance);
        setShowReasonModal(false);
      } else {
        alert(data.error || 'Failed to enter COMA');
      }
    } catch (error) {
      console.error('Failed to enter COMA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitComa = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coma/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        setComaStatus(false);
        await loadComaStatus();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to exit COMA');
      }
    } catch (error) {
      console.error('Failed to exit COMA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (comaStatus) {
      handleExitComa();
    } else {
      setShowReasonModal(true);
    }
  };

  return (
    <div className="bg-black border border-white/20 rounded-lg p-6 max-w-md">
      <h2 className="text-white text-xl font-bold mb-4">COMA Settings</h2>

      <div className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Status</p>
            <p className="text-white/60 text-sm">
              {comaStatus ? 'In COMA' : 'Active'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading || (!comaStatus && !canEnter)}
            className={`p-3 rounded-full transition-colors ${
              comaStatus
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Power size={24} className="text-white" />
          </button>
        </div>

        {/* Refills */}
        <div>
          <p className="text-white font-medium">Refills</p>
          <p className="text-white/60 text-sm">{refills} / 3</p>
          <p className="text-white/40 text-xs mt-1">
            Regenerates 1 per 24 hours
          </p>
        </div>

        {/* Talents */}
        <div>
          <p className="text-white font-medium">Talents</p>
          <p className="text-white/60 text-sm">{talentBalance}</p>
          <p className="text-white/40 text-xs mt-1">
            Cost: 50 Talents if no refills
          </p>
        </div>

        {/* Cooldown Warning */}
        {cooldownHours > 0 && !comaStatus && (
          <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
            <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-medium">Cooldown Active</p>
              <p className="text-yellow-400/80 text-xs">
                {Math.floor(cooldownHours)}h {Math.floor((cooldownHours % 1) * 60)}m remaining
              </p>
            </div>
          </div>
        )}

        {/* Insufficient Resources Warning */}
        {!comaStatus && refills === 0 && talentBalance < 50 && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded p-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">
              Insufficient refills or talents to enter COMA
            </p>
          </div>
        )}
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-black border border-white/20 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-bold mb-4">Choose Your Path</h3>
            <p className="text-white/60 text-sm mb-6">
              Why are you entering COMA?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleEnterComa('Choice')}
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Choice
              </button>
              <button
                onClick={() => handleEnterComa('Quest')}
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Quest
              </button>
              <button
                onClick={() => setShowReasonModal(false)}
                disabled={loading}
                className="w-full bg-white/10 text-white py-3 rounded font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
