'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import CoinBurst from './CoinBurst';

interface ThrowTalentButtonProps {
  onThrow: (amount: 1 | 5 | 10) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Throw Talent button with amount selector
 * Allows throwing 1, 5, or 10 Talents to another user
 */
export default function ThrowTalentButton({ 
  onThrow, 
  disabled = false,
  compact = false 
}: ThrowTalentButtonProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [burstAmount, setBurstAmount] = useState(0);

  const handleThrow = async (amount: 1 | 5 | 10) => {
    setThrowing(true);
    setShowSelector(false);
    
    try {
      await onThrow(amount);
      
      // Show coin burst animation
      setBurstAmount(amount);
      setShowBurst(true);
    } catch (error) {
      console.error('Failed to throw Talents:', error);
    } finally {
      setThrowing(false);
    }
  };

  return (
    <div className="relative">
      {/* Coin Burst Animation */}
      {showBurst && (
        <CoinBurst 
          amount={burstAmount} 
          onComplete={() => setShowBurst(false)} 
        />
      )}

      {/* Main Button */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        disabled={disabled || throwing}
        className={`
          flex items-center gap-1 
          ${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'}
          bg-gradient-to-r from-yellow-500 to-yellow-600 
          hover:from-yellow-600 hover:to-yellow-700
          disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed
          text-white font-semibold rounded-full 
          transition-all shadow-md hover:shadow-lg
          hover:scale-105 active:scale-95
        `}
      >
        <Coins className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        {!compact && <span>Throw</span>}
      </button>

      {/* Amount Selector Dropdown */}
      {showSelector && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowSelector(false)}
          />
          
          {/* Selector Menu */}
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-black/95 border border-yellow-500/50 rounded-lg p-2 shadow-xl backdrop-blur-sm">
            <div className="text-xs text-yellow-400 font-semibold mb-2 px-2">
              Throw Talents
            </div>
            <div className="flex flex-col gap-1">
              {[1, 5, 10].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleThrow(amount as 1 | 5 | 10)}
                  disabled={throwing}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 hover:bg-yellow-500/20 rounded-md transition-all text-white text-sm font-medium"
                >
                  <span>{amount}T</span>
                  <Coins className="w-4 h-4 text-yellow-400" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
