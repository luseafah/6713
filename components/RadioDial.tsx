'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';

interface RadioDialProps {
  isPlaying: boolean;
  isMuted: boolean;
  verifiedName: string;
  username: string;
  progress: number; // 0-100
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onSkip: () => void;
}

/**
 * 6713 Protocol: Radio Dial Mute
 * 
 * Physical radio aesthetic with:
 * - Rotating dial animation
 * - LED-style verified name reveal
 * - Glow-in-the-dark green screen
 * - Haptic click feedback (visual)
 */
export default function RadioDial({
  isPlaying,
  isMuted,
  verifiedName,
  username,
  progress,
  onToggleMute,
  onTogglePlay,
  onSkip,
}: RadioDialProps) {
  const [rotation, setRotation] = useState(0);
  const [showName, setShowName] = useState(false);

  // Rotate dial when playing
  useEffect(() => {
    if (isPlaying && !isMuted) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 50); // Smooth rotation
      return () => clearInterval(interval);
    }
  }, [isPlaying, isMuted]);

  // Show verified name when unmuted
  useEffect(() => {
    if (!isMuted && isPlaying) {
      setShowName(true);
    } else {
      setShowName(false);
    }
  }, [isMuted, isPlaying]);

  return (
    <div className="relative w-full max-w-md mx-auto p-8 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-3xl border border-white/10 shadow-2xl">
      {/* Radio Screen (LED Display) */}
      <div className="mb-8 h-20 bg-black rounded-lg border-2 border-zinc-800 shadow-inner overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/20 to-green-900/20" />
        
        {/* Verified Name LED Display */}
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <div
            className={`
              text-green-400 font-mono text-lg tracking-wider transition-all duration-500
              ${showName ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
            style={{
              textShadow: showName
                ? '0 0 10px rgba(74, 222, 128, 0.8), 0 0 20px rgba(74, 222, 128, 0.4)'
                : 'none',
            }}
          >
            {verifiedName}
          </div>
          <div
            className={`
              text-green-400/60 font-mono text-xs tracking-wider transition-all duration-500
              ${showName ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            @{username}
          </div>
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="h-full w-full opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
            }}
          />
        </div>
      </div>

      {/* Radio Dial (Main Control) */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Dial Outer Ring */}
        <div className="absolute w-48 h-48 rounded-full border-4 border-zinc-700 shadow-inner" />
        
        {/* Dial Inner Ring (Rotates) */}
        <div
          className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-600 transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Dial Indicator Marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute w-1 h-3 bg-yellow-500 rounded-full"
              style={{
                top: '10%',
                left: '50%',
                transformOrigin: '50% 400%',
                transform: `translateX(-50%) rotate(${angle}deg)`,
              }}
            />
          ))}
        </div>

        {/* Mute/Unmute Button (Center) */}
        <button
          onClick={onToggleMute}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 transform active:scale-95
            ${isMuted 
              ? 'bg-zinc-800 border-4 border-zinc-600' 
              : 'bg-yellow-500 border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
            }
          `}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX size={32} className="text-white" />
          ) : (
            <Volume2 size={32} className="text-black" />
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center transition-all transform active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} className="text-white" />
          ) : (
            <Play size={20} className="text-white ml-0.5" />
          )}
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center transition-all transform active:scale-95"
          aria-label="Skip"
        >
          <SkipForward size={20} className="text-white" />
        </button>
      </div>

      {/* Frequency Indicator */}
      <div className="mt-4 text-center">
        <div className="text-yellow-500 text-xs font-mono tracking-wider uppercase">
          The Pulse
        </div>
        <div className="text-white/40 text-xs font-mono">
          {isPlaying ? 'BROADCASTING' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
}
