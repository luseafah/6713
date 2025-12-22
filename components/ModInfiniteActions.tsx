'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, AlertCircle, Slash, Check, X, Pin, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ModInfiniteEditProps {
  postId: string;
  currentContent: string;
  currentHashtags?: string[];
  onSave?: () => void;
}

export function ModInfiniteEdit({ postId, currentContent, currentHashtags = [], onSave }: ModInfiniteEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(currentContent);
  const [hashtags, setHashtags] = useState(currentHashtags.join(' '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('wall_messages')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      // Log the edit in activity log
      await supabase
        .from('activity_log')
        .insert({
          action_type: 'mod_edit',
          target_type: 'post',
          target_id: postId,
          old_value: currentContent,
          new_value: content,
          metadata: { hashtags }
        });

      setIsEditing(false);
      onSave?.();
    } catch (err) {
      console.error('Error saving edit:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Edit as Moderator"
        >
          <Edit3 size={14} className="text-purple-400" />
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border border-purple-500/50 rounded-xl p-4 shadow-2xl"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/60 uppercase tracking-wider mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm resize-none focus:outline-none focus:border-purple-500/50"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 uppercase tracking-wider mb-1">
                Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#tag1 #tag2"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Check size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface TicketDropdownProps {
  postId: string;
  reportCount: number;
  onOpenTicket?: () => void;
  onForceSlash?: () => void;
  onPin?: () => void;
}

export function TicketDropdown({ postId, reportCount, onOpenTicket, onForceSlash, onPin }: TicketDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenTicket = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_open_ticket', {
        p_target_id: postId,
        p_target_type: 'post',
        p_reason: 'Flagged content review',
        p_severity: 'medium'
      });

      if (error) throw error;

      onOpenTicket?.();
      setIsOpen(false);
    } catch (err) {
      console.error('Error opening ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSlash = async () => {
    if (!confirm('Are you sure you want to slash this post? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete the post
      const { error: deleteError } = await supabase
        .from('wall_messages')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      // Log the action
      await supabase
        .from('activity_log')
        .insert({
          action_type: 'mod_slash',
          target_type: 'post',
          target_id: postId,
          metadata: { reason: 'Force slashed by moderator' }
        });

      onForceSlash?.();
      setIsOpen(false);
    } catch (err) {
      console.error('Error slashing post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('wall_messages')
        .update({ is_pinned: true })
        .eq('id', postId);

      if (error) throw error;

      onPin?.();
      setIsOpen(false);
    } catch (err) {
      console.error('Error pinning post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <AlertCircle size={18} className="text-orange-400" />
        {reportCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {reportCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <button
              onClick={handleOpenTicket}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <Edit3 size={16} className="text-blue-400" />
              <span className="text-white text-sm">Open Edit Ticket</span>
            </button>

            <button
              onClick={handleForceSlash}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600/20 transition-colors text-left"
            >
              <Slash size={16} className="text-red-400" />
              <span className="text-white text-sm">Force Slash</span>
            </button>

            <button
              onClick={handlePin}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <Pin size={16} className="text-yellow-400" />
              <span className="text-white text-sm">Pin to Global</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-white/40 text-xs hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface HashtagSlasherProps {
  hashtag: string;
  isSlashed?: boolean;
  onSlash?: () => void;
}

export function HashtagSlasher({ hashtag, isSlashed = false, onSlash }: HashtagSlasherProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [slashing, setSlashing] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPress = () => {
    setShowConfirm(true);
  };

  const handleTouchStart = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(handleLongPress, 800); // 800ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPressing(false);
  };

  const handleSlash = async () => {
    setSlashing(true);
    try {
      // Add to slashed hashtags table
      const { error: slashError } = await supabase
        .from('hashtags')
        .upsert({
          tag: hashtag,
          is_slashed: true,
          slashed_at: new Date().toISOString()
        });

      if (slashError) throw slashError;

      // Log the action
      await supabase
        .from('activity_log')
        .insert({
          action_type: 'mod_slash_hashtag',
          target_type: 'hashtag',
          target_id: hashtag,
          metadata: { hashtag }
        });

      onSlash?.();
      setShowConfirm(false);
    } catch (err) {
      console.error('Error slashing hashtag:', err);
    } finally {
      setSlashing(false);
    }
  };

  return (
    <>
      <button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        disabled={isSlashed}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-all ${
          isSlashed
            ? 'bg-gray-600/20 text-gray-500 line-through cursor-not-allowed'
            : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
        } ${isLongPressing ? 'scale-95' : ''}`}
      >
        {hashtag}
        {isSlashed && <Slash size={12} />}
      </button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gradient-to-br from-red-900/50 to-black border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <Slash size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Slash Hashtag?</h3>
                  <p className="text-sm text-white/60">This will disable it app-wide</p>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <p className="text-white text-center font-bold">{hashtag}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSlash}
                  disabled={slashing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold disabled:opacity-50 transition-colors"
                >
                  <Slash size={18} />
                  {slashing ? 'Slashing...' : 'Confirm Slash'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Mod indicator component to show on posts
export function ModActionIndicator() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded text-xs text-purple-300">
      <Edit3 size={10} />
      <span>Mod Edit</span>
    </div>
  );
}
