'use client';

import { DollarSign } from 'lucide-react';
import { useTalentThrowAnimation } from '@/lib/sensoryFeedback';

interface TalentThrowButtonProps {
  onThrow: () => void;
  disabled?: boolean;
}

/**
 * Talent Throw Button with Haptic Feedback
 * 
 * Protocol: Triple-tap vibration pattern when throwing talents
 * Visual pulse animation on click
 */
export default function TalentThrowButton({ onThrow, disabled = false }: TalentThrowButtonProps) {
  const { isThrowingTalent, throwTalent } = useTalentThrowAnimation();

  const handleThrow = () => {
    if (disabled) return;
    
    throwTalent();
    onThrow();
  };

  return (
    <button
      onClick={handleThrow}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-1 group
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title="Throw Talents"
    >
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-300 transform
          ${isThrowingTalent ? 'scale-125 rotate-12' : 'scale-100'}
          ${disabled 
            ? 'bg-white/5' 
            : 'bg-white/10 hover:bg-yellow-500/30 group-hover:scale-110'
          }
        `}
      >
        <DollarSign
          size={20}
          className={`
            transition-all duration-300
            ${isThrowingTalent ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-yellow-500'}
          `}
        />
      </div>
      <span className="text-yellow-500 text-xs font-bold">T</span>

      {/* Pulse Ring Animation */}
      {isThrowingTalent && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-yellow-500 animate-ping"
            style={{ animationDuration: '600ms' }}
          />
        </div>
      )}
    </button>
  );
}
