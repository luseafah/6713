'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slash, Trash, Edit3, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TimeAgo from '@/components/TimeAgo';

interface ActivityLogEntry {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  old_value?: string;
  new_value?: string;
  metadata?: any;
  created_at: string;
  actor_id?: string;
  actor_username?: string;
}

interface ActivityLogProps {
  userId?: string; // If provided, show only this user's activity
  limit?: number;
  showGlobalActions?: boolean; // Show mod/admin actions
}

export default function ActivityLog({ userId, limit = 50, showGlobalActions = false }: ActivityLogProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'edits' | 'slashes' | 'swaps'>('all');

  useEffect(() => {
    loadActivityLog();
  }, [userId, filter, showGlobalActions]);

  const loadActivityLog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by user if provided
      if (userId) {
        query = query.eq('actor_id', userId);
      }

      // Filter by action type
      if (filter !== 'all') {
        switch (filter) {
          case 'edits':
            query = query.eq('action_type', 'mod_edit');
            break;
          case 'slashes':
            query = query.in('action_type', ['mod_slash', 'mod_slash_hashtag']);
            break;
          case 'swaps':
            query = query.eq('action_type', 'elite_6_swap');
            break;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch actor usernames
      const entriesWithUsernames = await Promise.all(
        (data || []).map(async (entry) => {
          if (entry.actor_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', entry.actor_id)
              .single();

            return {
              ...entry,
              actor_username: userData?.username || 'Unknown'
            };
          }
          return entry;
        })
      );

      setEntries(entriesWithUsernames);
    } catch (err) {
      console.error('Error loading activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'mod_edit':
        return <Edit3 size={16} className="text-purple-400" />;
      case 'mod_slash':
      case 'mod_slash_hashtag':
        return <Slash size={16} className="text-red-400" />;
      case 'elite_6_swap':
        return <RefreshCw size={16} className="text-blue-400" />;
      case 'post_deleted':
        return <Trash size={16} className="text-red-400" />;
      default:
        return <AlertCircle size={16} className="text-white/40" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'mod_edit':
        return 'Edited Content';
      case 'mod_slash':
        return 'Slashed Post';
      case 'mod_slash_hashtag':
        return 'Slashed Hashtag';
      case 'elite_6_swap':
        return 'Elite 6 Swap';
      case 'post_deleted':
        return 'Deleted Post';
      default:
        return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'mod_edit':
        return 'border-purple-500/20 bg-purple-900/10';
      case 'mod_slash':
      case 'mod_slash_hashtag':
      case 'post_deleted':
        return 'border-red-500/20 bg-red-900/10';
      case 'elite_6_swap':
        return 'border-blue-500/20 bg-blue-900/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const renderEntry = (entry: ActivityLogEntry) => {
    return (
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl p-4 ${getActionColor(entry.action_type)}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="p-2 bg-black/40 rounded-lg">
            {getActionIcon(entry.action_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-sm">
                {getActionLabel(entry.action_type)}
              </span>
              {entry.actor_username && (
                <span className="text-white/60 text-xs">
                  by @{entry.actor_username}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2">
              {/* Old Value (Slashed Text) */}
              {entry.old_value && (
                <div className="text-sm">
                  <span className="text-white/40 text-xs uppercase tracking-wider block mb-1">
                    Original:
                  </span>
                  <div className="bg-black/40 rounded-lg p-2">
                    <p className="text-red-400 line-through opacity-60">
                      {entry.old_value}
                    </p>
                  </div>
                </div>
              )}

              {/* New Value */}
              {entry.new_value && (
                <div className="text-sm">
                  <span className="text-white/40 text-xs uppercase tracking-wider block mb-1">
                    Updated:
                  </span>
                  <div className="bg-black/40 rounded-lg p-2">
                    <p className="text-green-400">
                      {entry.new_value}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {entry.metadata && (
                <div className="text-xs text-white/60">
                  {entry.action_type === 'mod_slash_hashtag' && entry.metadata.hashtag && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 rounded text-red-400">
                      <Slash size={10} />
                      {entry.metadata.hashtag}
                    </div>
                  )}
                  {entry.action_type === 'elite_6_swap' && (
                    <div className="space-y-1">
                      {entry.metadata.old_video_id && (
                        <p>Replaced video: {entry.metadata.old_video_id.substring(0, 8)}...</p>
                      )}
                      {entry.metadata.slot_number && (
                        <p>Slot: {entry.metadata.slot_number}</p>
                      )}
                    </div>
                  )}
                  {entry.metadata.reason && (
                    <p className="mt-1 italic">Reason: {entry.metadata.reason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
              <Clock size={12} />
              <TimeAgo date={entry.created_at} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Activity History</h2>
        <div className="flex gap-2">
          {['all', 'edits', 'slashes', 'swaps'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadActivityLog}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>

      {/* Entries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-white/40" />
          </div>
        ) : entries.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {entries.map(renderEntry)}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-4">
              <CheckCircle size={32} className="text-white/40" />
            </div>
            <p className="text-white/60">No activity to show</p>
            <p className="text-white/40 text-sm mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'Actions will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini version for showing in post cards
export function ActivityLogInline({ postId }: { postId: string }) {
  const [lastAction, setLastAction] = useState<ActivityLogEntry | null>(null);

  useEffect(() => {
    loadLastAction();
  }, [postId]);

  const loadLastAction = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('target_id', postId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      setLastAction(data);
    } catch (err) {
      console.error('Error loading last action:', err);
    }
  };

  if (!lastAction) return null;

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg text-xs">
      {lastAction.action_type === 'mod_edit' && (
        <>
          <Edit3 size={10} className="text-purple-400" />
          <span className="text-purple-400">Edited by mod</span>
        </>
      )}
      {lastAction.action_type === 'mod_slash' && (
        <>
          <Slash size={10} className="text-red-400" />
          <span className="text-red-400">Slashed</span>
        </>
      )}
      {lastAction.action_type === 'elite_6_swap' && (
        <>
          <RefreshCw size={10} className="text-blue-400" />
          <span className="text-blue-400">Elite 6 Swap</span>
        </>
      )}
    </div>
  );
}
