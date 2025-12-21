'use client';

import { useEffect, useState } from 'react';

export default function GlazeProtocol() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check glaze protocol status
    const checkGlazeStatus = async () => {
      try {
        const response = await fetch('/api/admin/glaze-protocol');
        const data = await response.json();
        setIsActive(data.enabled);
      } catch (error) {
        console.error('Failed to check glaze protocol:', error);
      }
    };

    checkGlazeStatus();
    const interval = setInterval(checkGlazeStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Diagonal Glaze Shimmer Effect */}
      <div className="absolute inset-0 w-[200%] h-[200%] glaze-animate">
        <div className="absolute top-0 left-0 w-32 h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
      </div>
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 animate-pulse" />
      
      {/* God Mode Indicator */}
      <div className="absolute top-24 right-4 pointer-events-auto">
        <div className="bg-purple-900/80 backdrop-blur-sm border border-purple-500/50 rounded-lg px-4 py-2 text-purple-300 text-sm font-bold animate-pulse">
          ✨ GLAZE PROTOCOL ACTIVE ✨
        </div>
      </div>
    </div>
  );
}
