// =====================================================
// 6713 PROTOCOL: SENSORY ANIMATIONS & HAPTIC FEEDBACK
// =====================================================
// High-speed, reactive environment where interactions
// trigger immediate visual and haptic responses
// =====================================================

/**
 * Trigger device haptic feedback (vibration)
 * 
 * @param pattern - Vibration pattern: 'light', 'medium', 'heavy', or custom
 */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' | number[] = 'medium'): void {
  if (!navigator.vibrate) {
    return; // Device doesn't support vibration
  }

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };

  if (typeof pattern === 'string') {
    navigator.vibrate(patterns[pattern]);
  } else {
    navigator.vibrate(pattern);
  }
}

/**
 * Haptic Feedback for Talent Throw
 * Triple-tap sensation (10ms-50ms-10ms)
 */
export function hapticTalentThrow(): void {
  triggerHaptic([10, 30, 50, 30, 10]);
}

/**
 * Haptic Feedback for G$4U Gig tap
 * Single medium pulse
 */
export function hapticGigTap(): void {
  triggerHaptic('medium');
}

/**
 * Haptic Feedback for Like/Heart
 * Quick double-tap
 */
export function hapticLike(): void {
  triggerHaptic([15, 50, 15]);
}

/**
 * Haptic Feedback for Reply
 * Light single tap
 */
export function hapticReply(): void {
  triggerHaptic('light');
}

/**
 * Create 13-heart burst animation on like
 * Returns array of heart positions for rendering
 */
export function create13HeartBurst(): { id: number; x: number; y: number; delay: number; duration: number }[] {
  const hearts = [];
  
  for (let i = 0; i < 13; i++) {
    // Spread hearts in a burst pattern
    const angle = (i / 13) * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    
    hearts.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: i * 50, // Stagger animation
      duration: 1000 + Math.random() * 500,
    });
  }
  
  return hearts;
}

/**
 * Growing Frequency Poll Animation
 * Smooth slide from current to target percentage
 * 
 * @param currentPercent - Starting percentage
 * @param targetPercent - Ending percentage
 * @param duration - Animation duration in ms
 * @param onUpdate - Callback for each frame
 */
export function animatePollGrowth(
  currentPercent: number,
  targetPercent: number,
  duration: number = 800,
  onUpdate: (percent: number) => void
): void {
  const startTime = Date.now();
  const delta = targetPercent - currentPercent;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = currentPercent + (delta * eased);
    
    onUpdate(currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// =====================================================
// REACT HOOKS FOR SENSORY FEEDBACK
// =====================================================

import { useState, useCallback } from 'react';

/**
 * Hook for Like Animation with 13-heart burst
 */
export function useLikeAnimation() {
  const [hearts, setHearts] = useState<ReturnType<typeof create13HeartBurst>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerLike = useCallback(() => {
    hapticLike();
    setHearts(create13HeartBurst());
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
      setHearts([]);
    }, 1500);
  }, []);

  return { hearts, isAnimating, triggerLike };
}

/**
 * Hook for Poll Growth Animation
 */
export function usePollAnimation(initialPercent: number = 0) {
  const [displayPercent, setDisplayPercent] = useState(initialPercent);

  const animateTo = useCallback((targetPercent: number) => {
    animatePollGrowth(displayPercent, targetPercent, 800, setDisplayPercent);
  }, [displayPercent]);

  return { displayPercent, animateTo };
}

/**
 * Hook for Talent Throw Animation
 */
export function useTalentThrowAnimation() {
  const [isThrowingTalent, setIsThrowingTalent] = useState(false);

  const throwTalent = useCallback(() => {
    hapticTalentThrow();
    setIsThrowingTalent(true);

    setTimeout(() => {
      setIsThrowingTalent(false);
    }, 600);
  }, []);

  return { isThrowingTalent, throwTalent };
}

// =====================================================
// CSS ANIMATION UTILITIES
// =====================================================

/**
 * Generate Tailwind classes for heart burst animation
 */
export function getHeartBurstClasses(heart: { x: number; y: number; delay: number; duration: number }): string {
  return `
    absolute pointer-events-none text-red-500 animate-float-up
    transition-all duration-${heart.duration}
    opacity-0
  `;
}

/**
 * Get inline styles for heart position
 */
export function getHeartBurstStyle(heart: { x: number; y: number; delay: number }): React.CSSProperties {
  return {
    left: '50%',
    top: '50%',
    transform: `translate(${heart.x}px, ${heart.y}px)`,
    animationDelay: `${heart.delay}ms`,
  };
}

// =====================================================
// PROTOCOL CONSTANTS
// =====================================================

export const ANIMATION_CONFIG = {
  HEART_BURST_COUNT: 13,
  HEART_BURST_DURATION: 1500,
  POLL_ANIMATION_DURATION: 800,
  TALENT_THROW_DURATION: 600,
  HAPTIC_TALENT_PATTERN: [10, 30, 50, 30, 10],
  HAPTIC_GIG_PATTERN: [20],
  HAPTIC_LIKE_PATTERN: [15, 50, 15],
} as const;
