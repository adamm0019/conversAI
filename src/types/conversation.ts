export interface ContentItem {
  type: string;
  text: string;
}

export interface FormattedItem {
  text?: string;
  transcript?: string;
  audio?: Int16Array;
  output?: string;
  file?: {
    url: string;
  };
}

export interface EnhancedConversationItem {
  id: string;
  object: string;
  role: 'assistant' | 'user' | 'system';
  type: 'message';
  content?: Array<ContentItem> | string;
  formatted: FormattedItem;
  status?: 'completed' | 'in_progress' | 'failed';
  created_at: string;
  timestamp: number;
}

export interface ConversationMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: number;
}

export interface ConversationState {
  messages: ConversationMessage[];
  isConnected: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
}
