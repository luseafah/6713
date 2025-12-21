'use client';

import { useState } from 'react';
import { useQuickReplies } from '@/hooks/useDynamicMessage';
import { Send, Zap } from 'lucide-react';
import * as Icons from 'lucide-react';

interface QuickReplyBarProps {
  onSendReply: (content: string, label: string) => void;
  targetUserId?: string;
  contextVariables?: Record<string, string | number>;
}

export default function QuickReplyBar({
  onSendReply,
  targetUserId,
  contextVariables = {},
}: QuickReplyBarProps) {
  const { quickReplies, loading, sendQuickReply } = useQuickReplies();
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [showVariableInput, setShowVariableInput] = useState<string | null>(null);

  const handleQuickReply = async (replyId: string) => {
    const reply = quickReplies.find((qr) => qr.id === replyId);
    if (!reply) return;

    // Check if reply needs variables
    if (reply.variables.length > 0) {
      setShowVariableInput(replyId);
      return;
    }

    // Send without variables
    if (targetUserId) {
      const result = await sendQuickReply(replyId, targetUserId, {
        ...contextVariables,
      });
      if (result) {
        onSendReply(result.content, result.label);
      }
    }
  };

  const handleSendWithVariables = async (replyId: string) => {
    if (!targetUserId) return;

    const result = await sendQuickReply(replyId, targetUserId, {
      ...contextVariables,
      ...customVariables,
    });

    if (result) {
      onSendReply(result.content, result.label);
      setShowVariableInput(null);
      setCustomVariables({});
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="w-4 h-4" /> : <Zap className="w-4 h-4" />;
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30',
      orange: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30',
      green: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30',
      gold: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30',
    };
    return colorMap[color] || colorMap.yellow;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Zap className="w-4 h-4 animate-pulse" />
        Loading quick replies...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Reply Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <button
            key={reply.id}
            onClick={() => handleQuickReply(reply.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all ${getColorClasses(
              reply.color
            )}`}
          >
            {getIconComponent(reply.icon)}
            {reply.label}
          </button>
        ))}
      </div>

      {/* Variable Input Modal */}
      {showVariableInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-yellow-400 rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Fill Required Fields
            </h3>

            {quickReplies
              .find((qr) => qr.id === showVariableInput)
              ?.variables.map((variable: string) => (
                <div key={variable}>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    {variable.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={customVariables[variable] || ''}
                    onChange={(e) =>
                      setCustomVariables({
                        ...customVariables,
                        [variable]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    placeholder={`Enter ${variable}`}
                  />
                </div>
              ))}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowVariableInput(null);
                  setCustomVariables({});
                }}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendWithVariables(showVariableInput)}
                className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
