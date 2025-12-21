'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit3, Save, X, Eye, AlertCircle, Sparkles } from 'lucide-react';

interface SystemMessage {
  id: string;
  trigger_id: string;
  title: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  updated_at: string;
}

export default function ScriptEditor() {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingMessage, setEditingMessage] = useState<SystemMessage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const supabase = createClient();

  const categories = ['all', 'air_lock', 'god_mode', 'gig', 'wallet', 'coma', 'self_kill', 'general'];

  useEffect(() => {
    fetchMessages();
  }, [selectedCategory]);

  const fetchMessages = async () => {
    setLoading(true);
    let query = supabase
      .from('system_messages')
      .select('*')
      .order('category')
      .order('trigger_id');

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const startEditing = (message: SystemMessage) => {
    setEditingMessage(message);
    setEditTitle(message.title);
    setEditContent(message.content);
    
    // Initialize preview variables with placeholders
    const vars: Record<string, string> = {};
    message.variables.forEach((v) => {
      vars[v] = `[${v}]`;
    });
    setPreviewVariables(vars);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditTitle('');
    setEditContent('');
    setPreviewVariables({});
  };

  const saveMessage = async () => {
    if (!editingMessage) return;

    setSaving(true);
    const { error } = await supabase.rpc('admin_update_system_message', {
      p_trigger_id: editingMessage.trigger_id,
      p_title: editTitle,
      p_content: editContent,
    });

    if (error) {
      console.error('Error saving message:', error);
      alert('Failed to save message');
    } else {
      await fetchMessages();
      cancelEditing();
    }
    setSaving(false);
  };

  const toggleActive = async (message: SystemMessage) => {
    const { error } = await supabase
      .from('system_messages')
      .update({ is_active: !message.is_active })
      .eq('id', message.id);

    if (!error) {
      fetchMessages();
    }
  };

  const getPreviewContent = () => {
    if (!editingMessage) return '';
    let preview = editContent;
    Object.entries(previewVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return preview;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      air_lock: 'bg-blue-500/20 text-blue-400',
      god_mode: 'bg-red-500/20 text-red-400',
      gig: 'bg-green-500/20 text-green-400',
      wallet: 'bg-yellow-500/20 text-yellow-400',
      coma: 'bg-purple-500/20 text-purple-400',
      self_kill: 'bg-gray-500/20 text-gray-400',
      general: 'bg-zinc-500/20 text-zinc-400',
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-zinc-400">Loading scripts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-yellow-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Pope AI Script Editor</h2>
          <p className="text-sm text-zinc-400">
            Edit automated messages dynamically. Changes take effect immediately.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(message.category)}`}>
                    {message.category}
                  </span>
                  <code className="text-xs text-zinc-500 font-mono">{message.trigger_id}</code>
                  {!message.is_active && (
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                      Inactive
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white">{message.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{message.content}</p>

                {message.variables.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {message.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-1 rounded text-xs bg-zinc-800 text-yellow-400 font-mono"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEditing(message)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-400"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(message)}
                  className={`p-2 rounded-lg ${
                    message.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                  title={message.is_active ? 'Deactivate' : 'Activate'}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-yellow-400 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Script</h3>
                  <code className="text-sm text-zinc-500 font-mono">
                    {editingMessage.trigger_id}
                  </code>
                </div>
                <button
                  onClick={cancelEditing}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title Editor */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Variables */}
              {editingMessage.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Available Variables
                  </label>
                  <div className="space-y-2">
                    {editingMessage.variables.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-zinc-800 text-yellow-400 text-sm font-mono">
                          {`{{${v}}}`}
                        </code>
                        <input
                          type="text"
                          placeholder={`Test value for ${v}`}
                          value={previewVariables[v] || ''}
                          onChange={(e) =>
                            setPreviewVariables({ ...previewVariables, [v]: e.target.value })
                          }
                          className="flex-1 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:border-yellow-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </label>
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">
                    {editTitle.replace(/{{(\w+)}}/g, (_, key) => previewVariables[key] || `[${key}]`)}
                  </h4>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {getPreviewContent()}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300">
                  Changes take effect immediately. All users will see the updated message on their next trigger.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelEditing}
                  className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMessage}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
