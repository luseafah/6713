'use client';

import { X } from 'lucide-react';
import { Profile } from '@/types/database';

interface ComaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  username: string;
}

export default function ComaModal({ isOpen, onClose, profile, username }: ComaModalProps) {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-black border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">@{username}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-white/60 text-sm mb-1">COMA Status</p>
            <p className="text-white text-lg">
              {profile.coma_status ? 'In COMA' : 'Active'}
            </p>
          </div>

          {profile.coma_status && profile.coma_reason && (
            <div>
              <p className="text-white/60 text-sm mb-1">Reason</p>
              <p className="text-white text-lg font-medium">{profile.coma_reason}</p>
            </div>
          )}

          {profile.wiki && (
            <div>
              <p className="text-white/60 text-sm mb-1">Wiki</p>
              <p className="text-white whitespace-pre-wrap">{profile.wiki}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
