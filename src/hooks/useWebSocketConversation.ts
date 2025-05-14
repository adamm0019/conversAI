import { useCallback, useState, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Conversation } from '@11labs/client';
import { ConversationItem } from '../types/conversation';
import { ConnectionState } from '../types/connection';
import { DynamicVariables, sanitizeDynamicVariables } from '../types/dynamicVariables';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketHookOptions {
  agentId?: string;
  dynamicVariables?: DynamicVariables;
  serverUrl?: string;
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onMessageReceived?: (message: ConversationItem) => void;
}

export function useWebSocketConversation(options: WebSocketHookOptions = {}) {
  const {
    serverUrl = 'http://localhost:3001/api/get-signed-url',
    autoReconnect = true,
    onMessageReceived,
    agentId = 'struNpxnJkL8IlMMev4O',
    dynamicVariables = {},
    reconnectAttempts = 5,
    reconnectDelay = 3000
  } = options;

  const { user } = useAuth();


  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const conversationRef = useRef<Conversation | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const responseCallbackRef = useRef<((message: string) => void) | null>(null);
  const dynamicVarsRef = useRef<Record<string, any>>(dynamicVariables);


  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getDefaultDynamicVariables = useCallback((): DynamicVariables => {
    const defaults: DynamicVariables = {
      user_name: user?.displayName || user?.email?.split('@')[0] || 'there',
      subscription_tier: 'standard',
      language_level: 'beginner',
      target_language: 'Spanish',
      days_streak: 0,
      vocabulary_mastered: 0,
      grammar_mastered: 0,
      total_progress: 0
    };

    return sanitizeDynamicVariables({ ...defaults, ...dynamicVariables });
  }, [user, dynamicVariables]);

  const createMessageObject = useCallback((role: 'user' | 'assistant', content: string): ConversationItem => {
    return {
      id: Date.now().toString(),
      object: 'chat.completion',
      role: role,
      type: 'message',
      content: content,
      formatted: {
        text: content,
        transcript: content
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      status: 'completed'
    };
  }, []);

  const closeConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (conversationRef.current) {
      try {
        if (conversationRef.current.isOpen &&
          typeof conversationRef.current.isOpen === 'function' &&
          conversationRef.current.isOpen()) {

          conversationRef.current.endSession().catch(err => {
          });
        } else {

        }
      } catch (error) {
      } finally {
        conversationRef.current = null;
      }
    }

    if (isMountedRef.current) {
      setConnectionState(ConnectionState.DISCONNECTED);
      setIsSpeaking(false);
      setIsRecording(false);
      setIsThinking(false);
    }
  }, []);

  const mapStatus = useCallback((status: "connecting" | "connected" | "disconnecting" | "disconnected"): ConnectionState => {
    switch (status) {
      case 'connecting': return ConnectionState.CONNECTING;
      case 'connected': return ConnectionState.CONNECTED;
      case 'disconnecting': return ConnectionState.RECONNECTING;
      case 'disconnected': return ConnectionState.DISCONNECTED;
      default: return ConnectionState.DISCONNECTED;
    }
  }, []);

  const startConversation = useCallback(async (): Promise<boolean> => {
    if (isConnectingRef.current) {

      return false;
    }

    if (connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED) {

      return true;
    }

    try {
      if (conversationRef.current &&
        conversationRef.current.isOpen &&
        typeof conversationRef.current.isOpen === 'function' &&
        conversationRef.current.isOpen()) {

        return true;
      }

      if (conversationRef.current) {

        closeConnection();
      }

      isConnectingRef.current = true;

      if (isMountedRef.current) {
        setConnectionState(ConnectionState.CONNECTING);
        setError(null);
      }

      const newConversationId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (isMountedRef.current) {
        setConversationId(newConversationId);
      }


      const res = await fetch(serverUrl);
      if (!res.ok) throw new Error('Failed to fetch signed URL');
      const { signedUrl } = await res.json();

      const personalizedVars: DynamicVariables = sanitizeDynamicVariables(getDefaultDynamicVariables());
      dynamicVarsRef.current = personalizedVars;



      const conversation = await Conversation.startSession({
        signedUrl,
        clientTools: {},
        dynamicVariables: personalizedVars,
        agentId: agentId,
        onConnect: ({ conversationId }) => {
          if (!isMountedRef.current) return;

          setConnectionState(ConnectionState.CONNECTED);
          setError(null);
          setConversationId(conversationId);
          reconnectCountRef.current = 0;
          isConnectingRef.current = false;

        },
        onDisconnect: () => {
          if (!isMountedRef.current) return;


          setConnectionState(ConnectionState.DISCONNECTED);
          setIsSpeaking(false);
          setIsRecording(false);
          setIsThinking(false);

          if (conversationRef.current) {
            conversationRef.current = null;
          }

          if (autoReconnect && isMountedRef.current) {
            if (reconnectCountRef.current < reconnectAttempts) {
              reconnectCountRef.current++;
              const delay = reconnectDelay * reconnectCountRef.current;


              reconnectTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                  startConversation();
                }
              }, delay);
            }
          }
        },
        onMessage: ({ message, source }) => {
          if (!isMountedRef.current) return;

          const role = source === 'ai' ? 'assistant' : 'user';
          const newMessage = createMessageObject(role, message);

          setMessages(prev => [...prev, newMessage]);
          setIsThinking(false);

          if (onMessageReceived && source === 'ai') onMessageReceived(newMessage);

          if (responseCallbackRef.current && source === 'ai') {
            responseCallbackRef.current(message);
            responseCallbackRef.current = null;
          }
        },
        onError: (message, context) => {
          if (!isMountedRef.current) return;


          setError(message);
          setConnectionState(ConnectionState.ERROR);
          notifications.show({ title: 'Connection Error', message, color: 'red' });
          isConnectingRef.current = false;
        },
        onStatusChange: ({ status }) => {
          if (!isMountedRef.current) return;


          setConnectionState(mapStatus(status));
        },
        onModeChange: ({ mode }) => {
          if (!isMountedRef.current) return;

          setIsSpeaking(mode === 'speaking');
          setIsRecording(mode === 'listening');
        },
        onDebug: (props) => {
          if (!isMountedRef.current) return;

          if (props.type === 'thinking') {
            setIsThinking(true);
          }
        },
        onCanSendFeedbackChange: () => { },
        onAudio: () => { }
      });

      conversationRef.current = conversation;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';


      if (isMountedRef.current) {
        setError(errorMessage);
        setConnectionState(ConnectionState.ERROR);
      }

      notifications.show({ title: 'Connection Error', message: errorMessage, color: 'red' });
      isConnectingRef.current = false;

      if (autoReconnect && reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++;
        const delay = reconnectDelay * reconnectCountRef.current;


        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            startConversation();
          }
        }, delay);
      }
      return false;
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    agentId,
    autoReconnect,
    closeConnection,
    connectionState,
    conversationId,
    createMessageObject,
    getDefaultDynamicVariables,
    mapStatus,
    onMessageReceived,
    reconnectAttempts,
    reconnectDelay,
    serverUrl
  ]);

  const sendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<boolean> => {
    if (!conversationRef.current ||
      !conversationRef.current.isOpen ||
      !conversationRef.current.isOpen()) {

      notifications.show({ title: 'Connection Error', message: 'Not connected to ElevenLabs.', color: 'red' });
      return false;
    }

    try {
      const userMessage = createMessageObject('user', message);

      if (isMountedRef.current) {
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);
      }

      if (callback) {
        responseCallbackRef.current = callback;

        setTimeout(() => {
          responseCallbackRef.current = null;
        }, 30000);
      }


      conversationRef.current.sendContextualUpdate(message);
      return true;
    } catch (error) {

      notifications.show({ title: 'Error', message: 'Failed to send message.', color: 'red' });
      return false;
    }
  }, [createMessageObject]);

  const updateDynamicVariables = useCallback((variables: Record<string, any>) => {
    dynamicVarsRef.current = { ...dynamicVarsRef.current, ...variables };

    if (!conversationRef.current ||
      !conversationRef.current.isOpen ||
      !conversationRef.current.isOpen()) {
      return;
    }

    const safeVariables = sanitizeDynamicVariables(variables);

    try {



      const conversation = conversationRef.current as any;
      if (typeof conversation.updateDynamicVariables === 'function') {
        conversation.updateDynamicVariables(safeVariables);
      } else {
      }
    } catch (error) {

    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecording) {

      return true;
    }

    if (!conversationRef.current ||
      !conversationRef.current.isOpen ||
      !conversationRef.current.isOpen()) {

      const connected = await startConversation();
      if (!connected) return false;
    }

    try {

      if (conversationRef.current) {
        conversationRef.current.setMicMuted(false);
      }
      return true;
    } catch (error) {

      notifications.show({ title: 'Recording Error', message: 'Could not start recording.', color: 'red' });
      return false;
    }
  }, [isRecording, startConversation]);

  const stopRecording = useCallback(() => {
    if (conversationRef.current &&
      conversationRef.current.isOpen &&
      conversationRef.current.isOpen()) {

      conversationRef.current.setMicMuted(true);
    }
  }, []);

  const endConversation = useCallback(() => {

    closeConnection();

    if (isMountedRef.current) {
      setMessages([]);
      setConnectionState(ConnectionState.DISCONNECTED);
      setError(null);
      setIsSpeaking(false);
      setIsRecording(false);
      setIsThinking(false);
      setConversationId(null);
    }
  }, [closeConnection]);

  const getInputAudioLevel = useCallback(() => {
    try {
      return conversationRef.current?.getInputVolume() || 0;
    } catch (error) {
      return 0;
    }
  }, []);

  const getOutputAudioLevel = useCallback(() => {
    try {
      return conversationRef.current?.getOutputVolume() || 0;
    } catch (error) {
      return 0;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    try {
      if (conversationRef.current &&
        conversationRef.current.isOpen &&
        conversationRef.current.isOpen()) {
        conversationRef.current.setVolume({ volume });
      }
    } catch (error) {
    }
  }, []);


  useEffect(() => {
    return () => {
      try {
        closeConnection();


        conversationRef.current = null;
        reconnectTimeoutRef.current = null;
        isConnectingRef.current = false;
        responseCallbackRef.current = null;
      } catch (error) {

      }
    };
  }, [closeConnection]);

  return {
    connectionState,
    isThinking,
    isRecording,
    isSpeaking,
    error,
    messages,
    conversationId,
    startConversation,
    endConversation,
    sendMessage,
    startRecording,
    stopRecording,
    getInputAudioLevel,
    getOutputAudioLevel,
    setVolume,
    updateDynamicVariables
  };
}
