/**
 * 6713 Protocol - Live Stream Configuration
 * 1-Minute DVR Window for live video playback
 */

export interface LiveStreamConfig {
  /**
   * Maximum seekable buffer in seconds (60s = 1 minute)
   */
  dvrWindow: number;
  
  /**
   * Segment duration in seconds (HLS standard)
   */
  segmentDuration: number;
  
  /**
   * Maximum number of segments to keep in buffer
   */
  maxSegments: number;
}

/**
 * 6713 Protocol Live Stream Settings
 * DVR Window: 60 seconds (1 minute rewatch buffer)
 */
export const LIVE_STREAM_CONFIG: LiveStreamConfig = {
  dvrWindow: 60,           // 1 minute buffer
  segmentDuration: 2,      // 2-second HLS segments
  maxSegments: 30,         // 60s / 2s = 30 segments
};

/**
 * Calculate if segment should be pruned
 * @param segmentAge - Age of segment in seconds
 * @returns True if segment is older than DVR window + 2s
 */
export function shouldPruneSegment(segmentAge: number): boolean {
  return segmentAge > LIVE_STREAM_CONFIG.dvrWindow + LIVE_STREAM_CONFIG.segmentDuration;
}

/**
 * Get maximum seekable time for live video
 * @param currentTime - Current playback time in seconds
 * @returns Earliest seekable time (currentTime - 60s)
 */
export function getMinSeekTime(currentTime: number): number {
  return Math.max(0, currentTime - LIVE_STREAM_CONFIG.dvrWindow);
}

/**
 * Validate seek position for live stream
 * @param seekTime - Requested seek time
 * @param currentTime - Current live edge time
 * @returns Valid seek time within DVR window
 */
export function validateLiveSeek(seekTime: number, currentTime: number): number {
  const minTime = getMinSeekTime(currentTime);
  return Math.max(minTime, Math.min(seekTime, currentTime));
}
