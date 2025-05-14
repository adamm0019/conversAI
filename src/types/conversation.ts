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
  userEmail?: string;
  file?: {
    url: string;
  };
}

export interface ConversationItem {
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
  referenceText?: string;
  feedback?: PronunciationFeedback;
  language?: string;
  translation?: string;
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
  items: ConversationItem[];
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


export interface MessageBubbleProps {
  item: ConversationItem;
}


export interface AnimationStyles {
  transform?: string;
  opacity?: number;
  transition?: string;
}