'use client';

import { Menu, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface FixedHeaderProps {
  onMenuClick: () => void;
  onUploadClick?: () => void;
  isVerified: boolean;
}

export default function FixedHeader({ onMenuClick, onUploadClick, isVerified }: FixedHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Hamburger Menu */}
        <motion.button
          onClick={onMenuClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </motion.button>

        {/* Center: Upload Button (Verified Only) */}
        {isVerified && (
          <motion.button
            onClick={onUploadClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-1/2 -translate-x-1/2 p-3 bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-shadow"
            aria-label="Upload New Content"
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        )}

        {/* Right: Empty (for balance) */}
        <div className="w-10" />
      </div>
    </header>
  );
}
