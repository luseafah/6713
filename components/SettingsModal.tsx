'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comaStatus: boolean;
  onComaToggle: (status: boolean) => void;
  username: string;
  isVerified: boolean;
  role: string;
  talentBalance: number;
}

export default function SettingsModal({
  isOpen,
  onClose,
  comaStatus,
  onComaToggle,
  username,
  isVerified,
  role,
  talentBalance,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="glassmorphism rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Username</span>
            <span className="text-sm font-medium text-white">{username}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Role</span>
            <span className="text-sm font-medium text-white capitalize">{role}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Verified</span>
            <span className="text-sm font-medium text-white">
              {isVerified ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Talent Balance</span>
            <span className="text-sm font-medium text-white">{talentBalance}</span>
          </div>
        </div>

        {/* COMA Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">COMA Mode</h3>
              <p className="text-sm text-white/60">
                {comaStatus
                  ? 'Profile hidden, only whispers available'
                  : 'Profile visible, normal messaging'}
              </p>
            </div>
            <button
              onClick={() => onComaToggle(!comaStatus)}
              className={`relative w-14 h-8 rounded-full transition-all ${
                comaStatus ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  comaStatus ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Whisper Info */}
        {comaStatus && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-purple-300 mb-2">
              Whisper Mode Active
            </h4>
            <p className="text-xs text-white/70">
              You can send one-way messages (Whispers). Recipients cannot reply unless
              you turn off COMA or they pay 100 Talents for a 4th Wall Break.
            </p>
          </div>
        )}

        {/* Additional Settings */}
        <div className="space-y-3">
          <button className="w-full p-3 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-all">
            Account Settings
          </button>
          <button className="w-full p-3 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-all">
            Privacy & Security
          </button>
          <button className="w-full p-3 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-all">
            Notifications
          </button>
          <button className="w-full p-3 text-left text-sm text-red-400 hover:bg-white/5 rounded-lg transition-all">
            Self-Kill (Deactivate Account)
          </button>
        </div>
      </div>
    </div>
  );
}
