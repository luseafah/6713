'use client';

import { useEffect, useState } from 'react';

interface CoinBurstProps {
  amount: number;
  onComplete?: () => void;
}

/**
 * Coin burst animation shown when Talents are thrown
 * Brief visual feedback with particles and amount display
 */
export default function CoinBurst({ amount, onComplete }: CoinBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 1.5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  // Generate random particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) + Math.random() * 15, // Spread around circle
    distance: 40 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-coin-burst"
          style={{
            transform: `rotate(${particle.angle}deg) translateY(-${particle.distance}px)`,
            animationDelay: `${Math.random() * 0.1}s`,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg" />
        </div>
      ))}

      {/* Center amount display */}
      <div className="absolute animate-bounce-scale">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold px-4 py-2 rounded-full shadow-xl border-2 border-yellow-300">
          <span className="text-lg">+{amount}</span>
          <span className="text-xs ml-1">T</span>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute w-32 h-32 bg-yellow-400 rounded-full opacity-20 animate-ping" />
    </div>
  );
}
