// Remembrance Wiki types
export interface RemembranceWiki {
  id: string;
  creator_id: string;
  subject_name: string;
  subject_user_id?: string | null;
  relationship?: string;
  title: string;
  content: string;
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags?: RemembranceTag[];
}

export interface RemembranceTag {
  id: string;
  remembrance_id: string;
  tagged_user_id: string;
  tagged_username: string;
  created_at: string;
}
