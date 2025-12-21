export interface Gig {
  id: string;
  user_id: string;
  title: string;
  description: string;
  talent_reward: number;
  budge_enabled: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  // Joined data
  user_display_name?: string;
  user_profile_photo?: string;
  user_has_story?: boolean;
}
