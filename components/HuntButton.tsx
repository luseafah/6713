'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import HuntMode from '@/components/HuntMode';
import { useIsAdmin } from '@/components/GodModeControls';

interface HuntButtonProps {
  targetUserId: string;
  variant?: 'icon' | 'button';
}

/**
 * Hunt Button - Activates surveillance mode
 * Only visible to admins
 * Can be placed on profiles, posts, anywhere you need admin oversight
 */
export default function HuntButton({ targetUserId, variant = 'icon' }: HuntButtonProps) {
  const [huntActive, setHuntActive] = useState(false);
  const { isAdmin } = useIsAdmin();

  if (!isAdmin) return null;

  if (huntActive) {
    return <HuntMode targetUserId={targetUserId} onExit={() => setHuntActive(false)} />;
  }

  if (variant === 'button') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setHuntActive(true)}
        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-500 font-bold text-sm flex items-center gap-2 transition-all"
      >
        <Crosshair className="w-4 h-4" />
        Hunt Mode
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setHuntActive(true)}
      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full transition-all"
      title="Activate Hunt Mode"
    >
      <Crosshair className="w-5 h-5 text-red-500" />
    </motion.button>
  );
}
