// src/hooks/useEnhancedWebSocketConversation.ts
import { useCallback, useState, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Conversation } from '@11labs/client';
import { EnhancedConversationItem } from '../types/conversation';
import { ConnectionState } from '../types/connection';

interface WebSocketHookState {
    messages: EnhancedConversationItem[];
    connectionState: ConnectionState;
    error: string | null;
    isSpeaking: boolean;
    isRecording: boolean;
    isThinking: boolean;
    conversationId: string | null;
}

interface WebSocketHookOptions {
    serverUrl?: string;
    autoReconnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    onMessageReceived?: (message: EnhancedConversationItem) => void;
}

export const useEnhancedWebSocketConversation = (options: WebSocketHookOptions) => {
    const {
        serverUrl = 'http://localhost:3001/api/get-signed-url',
        autoReconnect = true,
        onMessageReceived
    } = options;

    const [state, setState] = useState<WebSocketHookState>({
        messages: [],
        connectionState: ConnectionState.DISCONNECTED,
        error: null,
        isSpeaking: false,
        isRecording: false,
        isThinking: false,
        conversationId: null
    });

    const conversationRef = useRef<Conversation | null>(null);
    const reconnectCountRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef<boolean>(false);
    const responseCallbackRef = useRef<((message: string) => void) | null>(null);

    const createMessageObject = useCallback((role: 'user' | 'assistant', content: string): EnhancedConversationItem => {
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
            conversationRef.current.endSession().catch(err => console.error('Error ending session:', err));
            conversationRef.current = null;
        }

        setState(prev => ({
            ...prev,
            connectionState: ConnectionState.DISCONNECTED,
            isSpeaking: false,
            isRecording: false,
            isThinking: false
        }));
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
        if (isConnectingRef.current) return false;
        if (conversationRef.current?.isOpen()) return true;

        isConnectingRef.current = true;

        try {
            setState(prev => ({ ...prev, connectionState: ConnectionState.CONNECTING, error: null }));

            const res = await fetch(serverUrl);
            if (!res.ok) throw new Error('Failed to fetch signed URL');
            const { signedUrl } = await res.json();

            const conversation = await Conversation.startSession({
                signedUrl,
                clientTools: {},
                onConnect: ({ conversationId }) => {
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.CONNECTED,
                        error: null,
                        conversationId
                    }));
                    reconnectCountRef.current = 0;
                    isConnectingRef.current = false;
                },
                onDisconnect: () => {
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.DISCONNECTED,
                        isSpeaking: false,
                        isRecording: false,
                        isThinking: false
                    }));
                },
                onMessage: ({ message, source }) => {
                    const role = source === 'ai' ? 'assistant' : 'user';
                    const newMessage = createMessageObject(role, message);
                    setState(prev => ({
                        ...prev,
                        messages: [...prev.messages, newMessage],
                        isThinking: false
                    }));
                    if (onMessageReceived && source === 'ai') onMessageReceived(newMessage);
                    if (responseCallbackRef.current && source === 'ai') {
                        responseCallbackRef.current(message);
                        responseCallbackRef.current = null;
                    }
                },
                onError: (message, context) => {
                    setState(prev => ({
                        ...prev,
                        error: message,
                        connectionState: ConnectionState.ERROR
                    }));
                    notifications.show({ title: 'Connection Error', message, color: 'red' });
                    isConnectingRef.current = false;
                },
                onStatusChange: ({ status }) => {
                    setState(prev => ({
                        ...prev,
                        connectionState: mapStatus(status)
                    }));
                },
                onModeChange: ({ mode }) => {
                    setState(prev => ({
                        ...prev,
                        isSpeaking: mode === 'speaking',
                        isRecording: mode === 'listening'
                    }));
                },
                onDebug: (props) => {
                    if (props.type === 'thinking') {
                        setState(prev => ({
                            ...prev,
                            isThinking: true
                        }));
                    }
                },
                onCanSendFeedbackChange: () => {},
                onAudio: () => {}
            });

            conversationRef.current = conversation;
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.ERROR,
                error: errorMessage
            }));
            notifications.show({ title: 'Connection Error', message: errorMessage, color: 'red' });
            isConnectingRef.current = false;
            if (autoReconnect && reconnectCountRef.current < (options.reconnectAttempts || 5)) {
                reconnectCountRef.current++;
                const delay = (options.reconnectDelay || 3000) * reconnectCountRef.current;
                reconnectTimeoutRef.current = setTimeout(() => {
                    startConversation();
                }, delay);
            }
            return false;
        }
    }, [createMessageObject, mapStatus, onMessageReceived, autoReconnect, options.reconnectAttempts, options.reconnectDelay, serverUrl]);

    const sendMessage = useCallback(async (text: string, responseCallback?: (response: string) => void): Promise<boolean> => {
        if (!conversationRef.current?.isOpen()) {
            notifications.show({ title: 'Connection Error', message: 'Not connected to ElevenLabs.', color: 'red' });
            return false;
        }

        try {
            const userMessage = createMessageObject('user', text);
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, userMessage],
                isThinking: true
            }));

            if (responseCallback) {
                responseCallbackRef.current = responseCallback;
                setTimeout(() => {
                    responseCallbackRef.current = null;
                }, 30000);
            }

            conversationRef.current.sendContextualUpdate(text);
            return true;
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Failed to send message.', color: 'red' });
            return false;
        }
    }, [createMessageObject]);

    const startRecording = useCallback(async (): Promise<boolean> => {
        if (state.isRecording) return true;

        if (!conversationRef.current?.isOpen()) {
            const connected = await startConversation();
            if (!connected) return false;
        }

        try {
            return true;
        } catch (error) {
            notifications.show({ title: 'Recording Error', message: 'Could not start recording.', color: 'red' });
            return false;
        }
    }, [state.isRecording, startConversation]);

    const stopRecording = useCallback(() => {
        if (conversationRef.current) conversationRef.current.setMicMuted(true);
    }, []);

    const endConversation = useCallback(() => {
        closeConnection();
        setState({
            messages: [],
            connectionState: ConnectionState.DISCONNECTED,
            error: null,
            isSpeaking: false,
            isRecording: false,
            isThinking: false,
            conversationId: null
        });
    }, [closeConnection]);

    useEffect(() => {
        return () => closeConnection();
    }, [closeConnection]);

    const getInputAudioLevel = useCallback(() => conversationRef.current?.getInputVolume() || 0, []);
    const getOutputAudioLevel = useCallback(() => conversationRef.current?.getOutputVolume() || 0, []);
    const setVolume = useCallback((volume: number) => {
        conversationRef.current?.setVolume({ volume });
    }, []);

    return {
        connectionState: state.connectionState,
        isThinking: state.isThinking,
        isRecording: state.isRecording,
        isSpeaking: state.isSpeaking,
        error: state.error,
        messages: state.messages,
        conversationId: state.conversationId,
        startConversation,
        endConversation,
        sendMessage,
        startRecording,
        stopRecording,
        getInputAudioLevel,
        getOutputAudioLevel,
        setVolume
    };
};
