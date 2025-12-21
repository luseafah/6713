'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Plus, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Gig } from '@/types/gig';

interface GigsModalProps {
  onClose: () => void;
  userId: string;
  talentBalance: number;
  onGigPosted: () => void;
}

export default function GigsModal({ onClose, userId, talentBalance, onGigPosted }: GigsModalProps) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [posting, setPosting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [talentReward, setTalentReward] = useState('');
  const [budgeEnabled, setBudgeEnabled] = useState(false);

  const activeCount = gigs.filter(g => !g.is_completed).length;
  const canPostMore = activeCount < 5;

  useEffect(() => {
    loadGigs();
  }, [userId]);

  const loadGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGigs(data || []);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostGig = async () => {
    if (!title.trim() || !description.trim() || !talentReward) return;
    if (talentBalance < 10) {
      alert('You need at least 10 Talents to post a Gig.');
      return;
    }

    setPosting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/gig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          talent_reward: parseInt(talentReward),
          budge_enabled: budgeEnabled
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post gig');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setTalentReward('');
      setBudgeEnabled(false);
      setShowPostForm(false);

      // Reload gigs
      await loadGigs();
      onGigPosted();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleCompleteGig = async (gigId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/gig/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ gig_id: gigId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete gig');
      }

      // Reload gigs
      await loadGigs();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900/40 to-black border-2 border-purple-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/60 to-black border-b-2 border-purple-500/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Your Gigs</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              <span className="text-white/60">Active Gigs: </span>
              <span className={`font-bold ${activeCount >= 5 ? 'text-red-400' : 'text-purple-400'}`}>
                {activeCount}/5
              </span>
            </div>
            <div className="text-sm">
              <span className="text-white/60">Your Balance: </span>
              <span className="font-bold text-yellow-400">{talentBalance} Talents</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Post New Gig Button */}
          {!showPostForm && (
            <button
              onClick={() => setShowPostForm(true)}
              disabled={!canPostMore || talentBalance < 10}
              className="w-full mb-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-4 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Post New Gig (10 Talents)
            </button>
          )}

          {!canPostMore && !showPostForm && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm font-semibold">
                You've reached the maximum of 5 active Gigs. Complete one to post another.
              </p>
            </div>
          )}

          {talentBalance < 10 && !showPostForm && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-center">
              <p className="text-yellow-400 text-sm font-semibold">
                You need at least 10 Talents to post a Gig.
              </p>
            </div>
          )}

          {/* Post Form */}
          {showPostForm && (
            <div className="mb-6 bg-black/60 border-2 border-purple-500/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Post New Gig</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Gig Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Design a logo for my startup"
                    className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you need..."
                    className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none min-h-[100px]"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Talent Reward
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={talentReward}
                      onChange={(e) => setTalentReward(e.target.value)}
                      placeholder="50"
                      min="1"
                      className="flex-1 bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-white/60 text-sm">Talents</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <input
                    type="checkbox"
                    id="budge"
                    checked={budgeEnabled}
                    onChange={(e) => setBudgeEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-yellow-500/50 bg-black/60"
                  />
                  <label htmlFor="budge" className="flex-1 text-white/80 text-sm">
                    <span className="font-semibold text-yellow-400">Enable BUDGE</span> - Your profile will have a yellow border in the Hue feed (flickers red if you also have an active Story)
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPostForm(false)}
                    className="flex-1 bg-white/10 border border-white/20 text-white font-semibold py-3 rounded-lg hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostGig}
                    disabled={posting || !title.trim() || !description.trim() || !talentReward}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? 'Posting...' : 'Post Gig (10 Talents)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gigs List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : gigs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No gigs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gigs.map((gig) => (
                <div
                  key={gig.id}
                  className={`bg-black/40 border-2 ${
                    gig.is_completed ? 'border-green-500/30' : 'border-purple-500/30'
                  } rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-bold flex-1">{gig.title}</h4>
                    {gig.is_completed && (
                      <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-xs font-semibold">DONE</span>
                      </div>
                    )}
                    {!gig.is_completed && gig.budge_enabled && (
                      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-md">
                        <span className="text-yellow-400 text-xs font-semibold">BUDGE</span>
                      </div>
                    )}
                  </div>

                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{gig.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-bold font-mono">{gig.talent_reward} Talents</span>
                    </div>

                    {!gig.is_completed && (
                      <button
                        onClick={() => handleCompleteGig(gig.id)}
                        className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold text-sm rounded-lg hover:bg-green-500/30 transition-all"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
