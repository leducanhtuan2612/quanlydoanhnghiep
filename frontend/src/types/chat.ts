export interface ChatEmployee {
  id: number;
  name: string;
  position?: string;
}

export interface Conversation {
  id: number;
  type: string;
  created_at: string;
  other_employee?: ChatEmployee;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}
