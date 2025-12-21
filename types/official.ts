interface OfficialAnnouncement {
  id: string;
  content: string;
  media_url?: string;
  donation_goal?: number;
  current_donations: number;
  goal_reached: boolean;
  mentioned_user_id?: string;
  mentioned_username?: string;
  created_at: string;
  archived_at?: string;
}

interface Donation {
  id: string;
  announcement_id: string;
  donor_user_id: string;
  donor_username: string;
  amount: number;
  created_at: string;
}
