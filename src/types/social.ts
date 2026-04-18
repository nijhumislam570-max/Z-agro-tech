export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  pet_id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_type: 'image' | 'video';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  liked_by_user?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  pet_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  pet_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
}

export interface Follow {
  id: string;
  follower_user_id: string;
  follower_pet_id: string | null;
  following_pet_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'appointment' | 'order' | 'verification' | 'new_appointment' | 'clinic' | 'system';
  title: string;
  message: string | null;
  actor_pet_id: string | null;
  target_post_id: string | null;
  target_pet_id: string | null;
  target_order_id: string | null;
  target_appointment_id: string | null;
  target_clinic_id: string | null;
  is_read: boolean;
  created_at: string;
  actor_pet?: Pet;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    pets: Pet[];
  };
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Story {
  id: string;
  pet_id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  pet?: Pet;
  viewed?: boolean;
}

export interface StoryGroup {
  pet: Pet;
  stories: Story[];
  hasUnviewed: boolean;
}
