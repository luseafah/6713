'use client';

import { useEffect, useState } from 'react';
import { FourthWallBreak } from '@/types/database';
import { supabase } from '@/lib/supabase';

export default function FourthWallRequests() {
  const [userId, setUserId] = useState<string>('');
  const [requests, setRequests] = useState<(FourthWallBreak & { requester_username: string })[]>([]);
  const [loading, setLoading] = useState(false);

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
      loadRequests();
      const interval = setInterval(loadRequests, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadRequests = async () => {
    try {
      const response = await fetch(`/api/dm/break-wall?coma_user_id=${userId}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load 4th wall requests:', error);
    }
  };

  const handleRespond = async (breakId: string, action: 'accept' | 'reject') => {
    if (loading) return;

    const confirmMsg = action === 'accept'
      ? 'Accept this request? You will receive 100 Talents.'
      : 'Reject this request? The 100 Talents will go to the Company.';

    if (!confirm(confirmMsg)) return;

    setLoading(true);

    try {
      const response = await fetch('/api/dm/break-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coma_user_id: userId,
          action,
          break_id: breakId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(action === 'accept' ? 'Request accepted! +100 Talents' : 'Request rejected.');
        await loadRequests();
      } else {
        alert(data.error || 'Failed to respond');
      }
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('Failed to send response');
    } finally {
      setLoading(false);
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 max-w-md bg-gray-900 border border-purple-500 rounded-lg shadow-2xl p-4 z-50">
      <h3 className="text-lg font-bold text-purple-400 mb-3">
        4th Wall Break Requests ({requests.length})
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {requests.map((req) => (
          <div key={req.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-sm text-white/60 mb-1">
              From: <span className="text-blue-400 font-bold">{req.requester_username}</span>
            </p>
            <p className="text-white mb-3">{req.message_content}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond(req.id, 'accept')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                Accept (+100 Talents)
              </button>
              <button
                onClick={() => handleRespond(req.id, 'reject')}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
