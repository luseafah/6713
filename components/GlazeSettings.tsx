'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GlazeSettings() {
  const [userId, setUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [glazeActive, setGlazeActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Check admin status
        const response = await fetch(`/api/profile?user_id=${user.id}`);
        const profile = await response.json();
        setIsAdmin(profile.is_admin || false);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStatus();
    }
  }, [isAdmin]);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/glaze-protocol');
      const data = await response.json();
      setGlazeActive(data.enabled);
    } catch (error) {
      console.error('Failed to load glaze status:', error);
    }
  };

  const toggleGlaze = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/admin/glaze-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: userId,
          enabled: !glazeActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGlazeActive(data.enabled);
        alert(data.enabled ? 'Glaze Protocol ACTIVATED' : 'Glaze Protocol DEACTIVATED');
      } else {
        alert(data.error || 'Failed to toggle glaze protocol');
      }
    } catch (error) {
      console.error('Failed to toggle glaze:', error);
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-purple-400 mb-4">
        ⚡ Admin God-Mode: Glaze Protocol
      </h2>
      
      <p className="text-white/70 mb-4">
        When activated, applies a diagonal shimmer effect across the entire UI and reveals Crown icons on posts.
        Click the Crown to override a post's like count to display "13+".
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleGlaze}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            glazeActive
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } disabled:opacity-50`}
        >
          {loading ? 'Updating...' : glazeActive ? 'GLAZE ACTIVE ✨' : 'GLAZE INACTIVE'}
        </button>

        <div className={`text-sm ${glazeActive ? 'text-purple-400' : 'text-gray-500'}`}>
          {glazeActive ? 'God-Mode Enabled' : 'God-Mode Disabled'}
        </div>
      </div>
    </div>
  );
}
