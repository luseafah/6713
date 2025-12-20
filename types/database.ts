export type Profile = {
  id: string;
  username: string;
  is_verified: boolean;
  role: 'user' | 'admin';
  coma_status: boolean;
  talent_balance: number;
  deactivated_at: string | null;
  cpr_count: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_whisper: boolean;
  created_at: string;
};

export type FourthWallBreak = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};
