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
  is_admin: boolean;
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
  created_at: string;
  reaction_count?: number;
  comment_count?: number;
  user_reacted?: boolean;
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
