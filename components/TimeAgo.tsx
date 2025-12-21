'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TimeAgoProps {
  date: string | Date;
  className?: string;
}

/**
 * Client-side safe time formatting component
 * Prevents hydration mismatches by only rendering on client after mount
 */
export default function TimeAgo({ date, className = '' }: TimeAgoProps) {
  const [timeString, setTimeString] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initial format
    const updateTime = () => {
      setTimeString(formatDistanceToNow(new Date(date), { addSuffix: true }));
    };
    
    updateTime();
    
    // Update every minute to keep it fresh
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [date]);

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{timeString}</span>;
}
