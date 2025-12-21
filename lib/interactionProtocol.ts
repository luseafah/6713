// =====================================================
// 6713 PROTOCOL: INTERACTION CONSTRAINTS
// =====================================================
// NO LIKES/COMMENTS on voice notes, pictures, videos
// ONLY INTERACTION: Reply or Talent Throw
// =====================================================

export type MediaType = 'voice' | 'image' | 'video' | 'text';
export type InteractionType = 'reply' | 'talent_throw';

/**
 * Protocol Rule: Determine if standard interactions (Likes/Comments) are allowed
 * 
 * @param mediaType - Type of content
 * @returns true if likes/comments are DISABLED (voice/image/video)
 */
export function isMediaOnlyReply(mediaType: MediaType): boolean {
  return ['voice', 'image', 'video'].includes(mediaType);
}

/**
 * Get allowed interactions for a media type
 * 
 * @param mediaType - Type of content
 * @returns Array of allowed interaction types
 */
export function getAllowedInteractions(mediaType: MediaType): InteractionType[] {
  // ALL media types allow Reply and Talent Throw
  return ['reply', 'talent_throw'];
}

/**
 * Check if Like button should be visible
 * 
 * @param mediaType - Type of content
 * @returns true if Like button should be shown
 */
export function canLike(mediaType: MediaType): boolean {
  // Only text posts can be liked
  return mediaType === 'text';
}

/**
 * Check if Comment button should be visible
 * 
 * @param mediaType - Type of content
 * @returns true if Comment button should be shown
 */
export function canComment(mediaType: MediaType): boolean {
  // Only text posts can have traditional comments
  // Media posts ONLY allow Replies
  return mediaType === 'text';
}

/**
 * Protocol Notice for Media Posts
 * 
 * @param mediaType - Type of content
 * @returns String explaining interaction rules
 */
export function getInteractionNotice(mediaType: MediaType): string {
  if (isMediaOnlyReply(mediaType)) {
    return "Reply or Throw Talents to interact";
  }
  return "Like, Reply, or Throw Talents";
}

/**
 * Format comment count with 67-ceiling protocol
 * 
 * @param count - Actual comment count
 * @returns Display string capped at "67"
 */
export function formatCommentCount(count: number): string {
  if (count > 67) return '67';
  return count.toString();
}

/**
 * Format like count with 13+ ceiling protocol
 * 
 * @param count - Actual like count
 * @returns Display string capped at "13+"
 */
export function formatLikeCount(count: number): string {
  if (count > 13) return '13+';
  return count.toString();
}

// =====================================================
// PROTOCOL CONSTANTS
// =====================================================
export const PROTOCOL_LIMITS = {
  COMMENT_CEILING: 67,
  LIKE_CEILING: 13,
  VIEWER_CEILING: 67,
} as const;

export const INTERACTION_RULES = {
  VOICE_NOTES: ['reply', 'talent_throw'] as const,
  IMAGES: ['reply', 'talent_throw'] as const,
  VIDEOS: ['reply', 'talent_throw'] as const,
  TEXT_POSTS: ['like', 'reply', 'talent_throw'] as const,
} as const;

// =====================================================
// EXPORT TYPES
// =====================================================
export type ProtocolLimits = typeof PROTOCOL_LIMITS;
export type InteractionRules = typeof INTERACTION_RULES;
