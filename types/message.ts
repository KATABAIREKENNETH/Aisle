export interface Conversation {
  id: string;
  wedding_id: string;
  name: string | null;
  is_group: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageFormData {
  conversation_id: string;
  content: string;
  reply_to_id?: string;
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface CreateConversationData {
  wedding_id: string;
  name?: string;
  is_group: boolean;
  participant_ids: string[];
}
