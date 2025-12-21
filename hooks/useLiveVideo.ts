import { useEffect, useRef, useState } from 'react';
import { LIVE_STREAM_CONFIG, validateLiveSeek, getMinSeekTime } from '@/lib/liveStreamConfig';

/**
 * 6713 Protocol - Live Video Hook
 * Enforces 1-minute DVR window (60-second rewatch buffer)
 */

interface UseLiveVideoOptions {
  isLive: boolean;
  videoUrl: string;
  onError?: (error: Error) => void;
}

export function useLiveVideo({ isLive, videoUrl, onError }: UseLiveVideoOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const liveEdgeRef = useRef(0); // Track the live edge

  /**
   * Handle video time updates
   */
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    setCurrentTime(time);

    // Update live edge for live streams
    if (isLive) {
      liveEdgeRef.current = Math.max(liveEdgeRef.current, time);
    }
  };

  /**
   * Handle seeking - enforce DVR window for live streams
   */
  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video || !isLive) return;

    const requestedTime = video.currentTime;
    const minTime = getMinSeekTime(liveEdgeRef.current);

    // Prevent seeking beyond 1-minute buffer
    if (requestedTime < minTime) {
      video.currentTime = minTime;
      console.log(`[6713 Protocol] Seek blocked: Outside 1-minute DVR window`);
    }
  };

  /**
   * Custom seek function that respects DVR window
   */
  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (isLive) {
      const validTime = validateLiveSeek(time, liveEdgeRef.current);
      video.currentTime = validTime;
    } else {
      video.currentTime = time;
    }
  };

  /**
   * Get seekable range info
   */
  const getSeekableRange = () => {
    if (!isLive) {
      return { min: 0, max: duration };
    }

    return {
      min: getMinSeekTime(liveEdgeRef.current),
      max: liveEdgeRef.current,
    };
  };

  /**
   * Check if time is within seekable range
   */
  const isTimeSeekable = (time: number): boolean => {
    const range = getSeekableRange();
    return time >= range.min && time <= range.max;
  };

  /**
   * Setup video event listeners
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
    });
    video.addEventListener('error', (e) => {
      onError?.(new Error(`Video error: ${video.error?.message}`));
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      video.removeEventListener('loadedmetadata', () => {});
      video.removeEventListener('error', () => {});
    };
  }, [isLive, onError]);

  /**
   * For live streams, periodically update live edge
   */
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        liveEdgeRef.current = video.currentTime;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  return {
    videoRef,
    currentTime,
    duration,
    isPlaying,
    seekTo,
    getSeekableRange,
    isTimeSeekable,
    dvrWindow: LIVE_STREAM_CONFIG.dvrWindow,
    liveEdge: liveEdgeRef.current,
  };
}
