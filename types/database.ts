export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  wiki?: string;
  nickname?: string; // 10 char max Wall identifier
  first_name?: string; // Full first name (verified users only)
  last_name?: string; // Full last name (verified users only)
  blocker_preference?: 'black' | 'white'; // Profile picture blocker choice
  profile_photo_url?: string; // Profile picture URL
  
  // Wiki Compulsory Fields
  hobbies?: string;
  movies?: string[]; // 3 favorite movies
  songs?: string[]; // 3 favorite songs
  signature_phrase?: string; // A phrase I always say
  pinned_gig_id?: string; // Pinned gig (verified users only)
  
  // Remembrance Wiki Permission
  can_create_remembrance_wiki?: boolean; // Admin-granted permission
  can_create_unlimited_remembrance_wikis?: boolean; // Admin toggle: bypass 3 wiki limit
  
  is_admin: boolean;
  is_moderator?: boolean; // Moderator permission for editing/deleting content
  verified_at?: string; // NULL = not verified, NOT NULL = verified
  
  // COMA System
  coma_status: boolean;
  coma_reason?: 'Choice' | 'Quest';
  coma_entered_at?: string;
  coma_exited_at?: string;
  coma_refills: number;
  coma_refills_last_updated: string;
  
  // Talent Economy
  talent_balance: number;
  
  // Self-Kill & Shrine
  deactivated_at?: string;
  shrine_link?: string;
  shrine_media?: string;
  last_shrine_edit?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: boolean;
  updated_at: string;
}

export interface WallMessage {
  id: string;
  user_id: string;
  username: string;
  content: string;
  media_url?: string | null; // URL to uploaded media from storage bucket
  message_type: 'text' | 'voice' | 'picture' | 'system';
  post_type: 'wall' | 'story'; // Wall = 3 days, Story = 24h
  expires_at?: string | null; // Auto-calculated based on post_type
  is_permanent: boolean; // Pope AI, system messages bypass expiration
  is_pope_ai: boolean;
  is_coma_whisper: boolean;
  admin_rigged_stats: boolean;
  
  // Admin Slasher Moderation
  is_slashed?: boolean; // True if message has been slashed by moderator
  slashed_by?: string | null; // User ID of moderator who slashed
  slashed_at?: string | null; // Timestamp of slash action
  original_content?: string | null; // Original content before slash (audit trail)
  slash_reason?: string | null; // Optional moderator note
  
  created_at: string;
  reaction_count?: number;
  comment_count?: number;
  user_reacted?: boolean;
  profiles?: { // Relation for nickname display
    nickname?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

export interface CPRRescue {
  id: string;
  ghost_user_id: string;
  rescuer_user_id: string;
  created_at: string;
}

export interface DMThread {
  id: string;
  user_id: string;
  is_pope_ai: boolean;
  created_at: string;
}

export interface DMMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  is_whisper: boolean;
  fourth_wall_broken: boolean;
  created_at: string;
}

export interface WallReaction {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
}

export interface PostCooldown {
  user_id: string;
  last_post_at: string;
  updated_at: string;
}

export interface CPRLog {
  id: string;
  ghost_user_id: string;
  rescuer_user_id: string;
  batch_number: number;
  shrine_link_viewed: boolean;
  shrine_link_viewed_at?: string;
  created_at: string;
}

export interface FourthWallBreak {
  id: string;
  coma_user_id: string;
  requester_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message_content: string;
  created_at: string;
  responded_at?: string;
}

export interface AdminPostOverride {
  id: string;
  post_id: string;
  override_like_count: string;
  overridden_by: string;
  created_at: string;
}

// $$$ Money Chat System
export interface MoneyChatMessage {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message_type: 'text' | 'image' | 'voice';
  content?: string;
  media_url?: string;
  is_payment_proof: boolean;
  is_strikethrough: boolean;
  admin_user_id?: string;
  created_at: string;
}

export interface MoneyChatMetadata {
  user_id: string;
  unread_count: number;
  last_message_at: string;
  last_admin_response_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  user_id: string;
  message_id: string;
  proof_type: 'screenshot' | 'receipt' | 'other';
  amount_claimed: number;
  talents_requested: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
}

// Pretty Link Sharing
export interface SharedPost {
  id: string;
  sharer_user_id: string;
  original_post_id: string;
  original_artist_id: string;
  preview_media_url: string;
  media_type: 'photo' | 'video';
  aspect_ratio: number;
  sound_name: string;
  artist_username: string;
  artist_typography_style: ArtistTypographyStyle;
  share_message?: string;
  wall_message_id: string;
  tap_count: number;
  created_at: string;
}

export interface ArtistTypographyStyle {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  color?: string;
  textShadow?: string;
  letterSpacing?: string;
  textTransform?: string;
  customCss?: Record<string, any>;
}

export interface ArtistTypography {
  user_id: string;
  font_family: string;
  font_weight: string;
  font_size: string;
  text_color: string;
  text_shadow: string;
  letter_spacing: string;
  text_transform: string;
  custom_css: Record<string, any>;
  created_at: string;
  updated_at: string;
}
