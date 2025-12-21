/**
 * 6713 Protocol - Engagement Ceiling
 * Hard-caps visible metrics to maintain mystique and prevent vanity metrics
 */

/**
 * Format viewer count with 67+ ceiling
 * @param count - Actual viewer count
 * @returns Formatted string (e.g., "67+ Viewers")
 */
export function formatViewerCount(count: number): string {
  if (count >= 67) {
    return '67+';
  }
  return count.toString();
}

/**
 * Format like count with 13+ ceiling
 * @param count - Actual like count
 * @returns Formatted string (e.g., "13+")
 */
export function formatLikeCount(count: number): string {
  if (count >= 13) {
    return '13+';
  }
  return count.toString();
}

/**
 * Check if metric should show "+" indicator
 */
export function isViewerCountCapped(count: number): boolean {
  return count >= 67;
}

export function isLikeCountCapped(count: number): boolean {
  return count >= 13;
}
