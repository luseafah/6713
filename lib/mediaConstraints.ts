/**
 * Media Constraints for Startup Efficiency
 * 
 * Limits:
 * - Voice Notes: 15 seconds max
 * - Videos: 15 seconds max
 * - File Size: 50MB hard limit
 * 
 * Rationale:
 * - Micro-Frequencies: Forces concise, punchy content
 * - Cloud Cost Control: Prevents storage bloat
 * - Fast Loading: Keeps UI snappy
 */

export const MEDIA_CONSTRAINTS = {
  VOICE_MAX_DURATION: 15, // seconds
  VIDEO_MAX_DURATION: 15, // seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB in bytes
  MAX_FILE_SIZE_MB: 50,
} as const;

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file size before upload
 */
export function validateFileSize(file: File): MediaValidationResult {
  if (file.size > MEDIA_CONSTRAINTS.MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${MEDIA_CONSTRAINTS.MAX_FILE_SIZE_MB}MB.`,
    };
  }
  return { valid: true };
}

/**
 * Validate video duration
 */
export async function validateVideoDuration(file: File): Promise<MediaValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      
      const duration = Math.floor(video.duration);
      
      if (duration > MEDIA_CONSTRAINTS.VIDEO_MAX_DURATION) {
        resolve({
          valid: false,
          error: `Video too long (${duration}s). Maximum duration is ${MEDIA_CONSTRAINTS.VIDEO_MAX_DURATION}s.`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    video.onerror = () => {
      resolve({
        valid: false,
        error: 'Could not read video metadata.',
      });
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate audio duration
 */
export async function validateAudioDuration(blob: Blob): Promise<MediaValidationResult> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      
      const duration = Math.floor(audio.duration);
      
      if (duration > MEDIA_CONSTRAINTS.VOICE_MAX_DURATION) {
        resolve({
          valid: false,
          error: `Voice note too long (${duration}s). Maximum duration is ${MEDIA_CONSTRAINTS.VOICE_MAX_DURATION}s.`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    audio.onerror = () => {
      resolve({
        valid: false,
        error: 'Could not read audio metadata.',
      });
    };

    audio.src = URL.createObjectURL(blob);
  });
}

/**
 * Validate media file before upload (combines all checks)
 */
export async function validateMediaFile(
  file: File,
  type: 'image' | 'video' | 'audio'
): Promise<MediaValidationResult> {
  // Check file size first (fastest check)
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;

  // Check duration for video/audio
  if (type === 'video') {
    return await validateVideoDuration(file);
  } else if (type === 'audio') {
    return await validateAudioDuration(file);
  }

  return { valid: true };
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
