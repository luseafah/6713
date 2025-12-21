'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Ghost, Zap, Eye, Lock } from 'lucide-react';
import { useDynamicMessage } from '@/hooks/useDynamicMessage';

interface UserState {
  user_state: 'new' | 'active' | 'coma' | 'self_killed';
  coma_started_at?: string;
  self_kill_date?: string;
  shrine_message?: string;
}

export default function UserStateGuard({
  userState,
  children,
}: {
  userState: UserState;
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Handle different states
  if (userState.user_state === 'new') {
    // User is in Air-Lock - redirect to authentication flow
    if (typeof window !== 'undefined') {
      router.push('/auth');
    }
    return null;
  }

  if (userState.user_state === 'coma') {
    return <ComaState comaStartedAt={userState.coma_started_at} />;
  }

  if (userState.user_state === 'self_killed') {
    return (
      <ShrineState
        selfKillDate={userState.self_kill_date}
        shrineMessage={userState.shrine_message}
      />
    );
  }

  // Active user - render normally
  return <>{children}</>;
}

function ComaState({ comaStartedAt }: { comaStartedAt?: string }) {
  const { message } = useDynamicMessage('on_coma_entry', {
    user_name: 'User',
    inactive_days: comaStartedAt
      ? Math.floor(
          (Date.now() - new Date(comaStartedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0,
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
            <Eye className="w-12 h-12 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white">Coma State</h1>

        {/* Message */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <p className="text-zinc-300 leading-relaxed">
            {message?.content ||
              'Your account is in Coma state. You can view content but cannot post, reply, or throw Talents. Contact support to reactivate.'}
          </p>

          {comaStartedAt && (
            <p className="text-sm text-zinc-500">
              Coma started: {new Date(comaStartedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            <strong>View-Only Mode:</strong> You can browse the Wall, Search, and Hue, but all
            interaction buttons are disabled.
          </p>
        </div>

        {/* Action */}
        <button
          onClick={() => {
            // Contact support or request reactivation
            alert('Contact Pope AI to request account reactivation.');
          }}
          className="w-full px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
        >
          Request Reactivation
        </button>
      </div>
    </div>
  );
}

function ShrineState({
  selfKillDate,
  shrineMessage,
}: {
  selfKillDate?: string;
  shrineMessage?: string;
}) {
  const expiryDate = selfKillDate
    ? new Date(new Date(selfKillDate).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;

  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const { message } = useDynamicMessage('on_self_kill_shrine', {
    shrine_expiry: expiryDate?.toLocaleDateString() || 'Unknown',
    shrine_message: shrineMessage || 'Left the frequency',
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
            <Ghost className="w-12 h-12 text-zinc-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-500">Shrine</h1>

        {/* Epitaph */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <p className="text-lg text-zinc-400 italic leading-relaxed">
            &ldquo;{shrineMessage || 'Left the frequency'}&rdquo;
          </p>

          {selfKillDate && (
            <p className="text-sm text-zinc-600">
              Departed: {new Date(selfKillDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Countdown */}
        {daysRemaining > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-300">
              <strong>Final Deletion:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}{' '}
              remaining
            </p>
            <p className="text-xs text-red-400 mt-2">
              All data will be permanently deleted on {expiryDate?.toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Lock Icon */}
        <div className="flex justify-center">
          <Lock className="w-8 h-8 text-zinc-700" />
        </div>

        <p className="text-sm text-zinc-600">This account is locked during the Shrine period.</p>
      </div>
    </div>
  );
}

// Hook to check if user can interact (used throughout app)
export function useCanInteract(userState: string) {
  return userState === 'active';
}

// Hook to check specific permissions
export function useUserPermissions(userState: string) {
  const isActive = userState === 'active';
  const canView = ['active', 'coma'].includes(userState);

  return {
    canPost: isActive,
    canReply: isActive,
    canThrow: isActive,
    canCreateGig: isActive,
    canView: canView,
    canInteract: isActive,
  };
}
