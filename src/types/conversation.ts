import { PronunciationFeedback } from '../services/AzurePronunciationService';

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
  isThinking?: boolean;
  audioUrl?: string;
  referenceText?: string; // Text that the user was trying to say (for pronunciation assessment)
  feedback?: PronunciationFeedback; // Feedback on pronunciation, grammar, etc.
  language?: string; // Language code (e.g., 'en-US', 'es-ES')
  translation?: string; // Translation of the message
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

export interface ChatSectionProps {
  items: EnhancedConversationItem[];
  isConnected: boolean;
  isRecording: boolean;
  isInitializing?: boolean;
  connectionError?: string | null;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConnect: () => Promise<void>;
  onSendMessage: (message: string) => Promise<void>;
  clientCanvasRef: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement>;
}

// helper type for message bubble with enhanced chat item
export interface MessageBubbleProps {
  item: EnhancedConversationItem;
}

// some types for animations - not used currently
export interface AnimationStyles {
  transform?: string;
  opacity?: number;
  transition?: string;
}