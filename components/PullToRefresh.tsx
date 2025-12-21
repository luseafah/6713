'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPullDistance?: number;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start if scrolled to top
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === 0 || window.scrollY > 0 || isRefreshing) return;

      const currentTouch = e.touches[0].clientY;
      const distance = currentTouch - touchStart;

      if (distance > 0) {
        // Apply resistance curve - harder to pull as you go further
        const resistedDistance = Math.min(
          distance * 0.5,
          maxPullDistance
        );
        setPullDistance(resistedDistance);

        // Prevent default scrolling if pulling down
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [touchStart, isRefreshing, maxPullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    setTouchStart(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const refreshProgress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm border-b border-zinc-800 transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, maxPullDistance)}px`,
            opacity: Math.min(pullDistance / threshold, 1),
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Spinner/Icon */}
            <div
              className={`relative ${
                isRefreshing || shouldTrigger ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${(refreshProgress * 360) / 100}deg)`,
              }}
            >
              <RefreshCw
                className={`w-6 h-6 transition-colors ${
                  shouldTrigger || isRefreshing
                    ? 'text-yellow-400'
                    : 'text-zinc-500'
                }`}
              />
            </div>

            {/* Status Text */}
            <p
              className={`text-xs font-medium transition-colors ${
                shouldTrigger || isRefreshing
                  ? 'text-yellow-400'
                  : 'text-zinc-500'
              }`}
            >
              {isRefreshing
                ? 'Refreshing...'
                : shouldTrigger
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </p>

            {/* Progress Bar */}
            {!isRefreshing && (
              <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-100"
                  style={{ width: `${refreshProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isRefreshing
            ? `translateY(${threshold}px)`
            : `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Simplified version for button-based refresh (desktop/fallback)
 */
export function RefreshButton({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-400 transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}
