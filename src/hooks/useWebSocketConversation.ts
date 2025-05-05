import { useCallback, useState, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Conversation } from '@11labs/client';
import { EnhancedConversationItem } from '../types/conversation';
import { ConnectionState } from '../types/connection';
import { useUser } from '@clerk/clerk-react';
import { DynamicVariables, sanitizeDynamicVariables } from '../types/dynamicVariables';

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
    agentId?: string;
    dynamicVariables?: DynamicVariables;
}

export const useWebSocketConversation = (options: WebSocketHookOptions) => {
    const {
        serverUrl = 'http://localhost:3001/api/get-signed-url',
        autoReconnect = true,
        onMessageReceived,
        agentId = 'JLN0MSwr6AtVxCQM32XU', 
        dynamicVariables = {} 
    } = options;

    const { user } = useUser();

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
    const isMountedRef = useRef<boolean>(true);
    const responseCallbackRef = useRef<((message: string) => void) | null>(null);

    // Track if component is mounted to prevent state updates after unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const getDefaultDynamicVariables = useCallback((): DynamicVariables => {
        const defaults: DynamicVariables = {
            user_name: user?.firstName || 'there',
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
            try {
                // Only attempt to end session if connection is open
                if (conversationRef.current.isOpen && conversationRef.current.isOpen()) {
                    console.log("Properly closing WebSocket connection");
                    conversationRef.current.endSession().catch(err => {
                        console.warn('Error ending session:', err);
                    });
                }
            } catch (error) {
                console.warn('Error checking connection state or ending session:', error);
            }
            
            conversationRef.current = null;
        }

        if (isMountedRef.current) {
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.DISCONNECTED,
                isSpeaking: false,
                isRecording: false,
                isThinking: false
            }));
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
            console.log("Connection attempt already in progress, skipping");
            return false;
        }
        
        try {
            // Check if there's already an active connection
            if (conversationRef.current && conversationRef.current.isOpen && conversationRef.current.isOpen()) {
                console.log("WebSocket connection already exists and is open");
                return true;
            }
            
            // If we have a reference but it's not open, clean it up first
            if (conversationRef.current) {
                console.log("Cleaning up existing WebSocket reference before creating new one");
                closeConnection();
            }

            isConnectingRef.current = true;

            if (isMountedRef.current) {
                setState(prev => ({ ...prev, connectionState: ConnectionState.CONNECTING, error: null }));
            }

            console.log("Fetching signed URL...");
            const res = await fetch(serverUrl);
            if (!res.ok) throw new Error('Failed to fetch signed URL');
            const { signedUrl } = await res.json();

            const personalizedVars: DynamicVariables = sanitizeDynamicVariables(getDefaultDynamicVariables());

            console.log('Starting conversation with dynamic variables:', personalizedVars);

            const conversation = await Conversation.startSession({
                signedUrl,
                clientTools: {},
                dynamicVariables: personalizedVars,
                agentId: agentId,
                onConnect: ({ conversationId }) => {
                    if (!isMountedRef.current) return;
                    
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.CONNECTED,
                        error: null,
                        conversationId
                    }));
                    reconnectCountRef.current = 0;
                    isConnectingRef.current = false;
                    console.log("Successfully connected to 11labs service");
                },
                onDisconnect: () => {
                    if (!isMountedRef.current) return;
                    
                    console.log("WebSocket disconnected");
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.DISCONNECTED,
                        isSpeaking: false,
                        isRecording: false,
                        isThinking: false
                    }));
                },
                onMessage: ({ message, source }) => {
                    if (!isMountedRef.current) return;
                    
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
                    if (!isMountedRef.current) return;
                    
                    console.error("WebSocket error:", message, context);
                    setState(prev => ({
                        ...prev,
                        error: message,
                        connectionState: ConnectionState.ERROR
                    }));
                    notifications.show({ title: 'Connection Error', message, color: 'red' });
                    isConnectingRef.current = false;
                },
                onStatusChange: ({ status }) => {
                    if (!isMountedRef.current) return;
                    
                    console.log("WebSocket status changed:", status);
                    setState(prev => ({
                        ...prev,
                        connectionState: mapStatus(status)
                    }));
                },
                onModeChange: ({ mode }) => {
                    if (!isMountedRef.current) return;
                    
                    setState(prev => ({
                        ...prev,
                        isSpeaking: mode === 'speaking',
                        isRecording: mode === 'listening'
                    }));
                },
                onDebug: (props) => {
                    if (!isMountedRef.current) return;
                    
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
            console.error("WebSocket connection error:", error);
            
            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    connectionState: ConnectionState.ERROR,
                    error: errorMessage
                }));
            }
            
            notifications.show({ title: 'Connection Error', message: errorMessage, color: 'red' });
            isConnectingRef.current = false;
            
            if (autoReconnect && reconnectCountRef.current < (options.reconnectAttempts || 5)) {
                reconnectCountRef.current++;
                const delay = (options.reconnectDelay || 3000) * reconnectCountRef.current;
                console.log(`Will attempt reconnection in ${delay}ms (attempt ${reconnectCountRef.current})`);
                
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
    }, [createMessageObject, mapStatus, onMessageReceived, autoReconnect, options.reconnectAttempts, options.reconnectDelay, serverUrl, getDefaultDynamicVariables, agentId, closeConnection]);

    const sendMessage = useCallback(async (text: string, responseCallback?: (response: string) => void): Promise<boolean> => {
        if (!conversationRef.current || !conversationRef.current.isOpen || !conversationRef.current.isOpen()) {
            console.log("Cannot send message: No active connection");
            notifications.show({ title: 'Connection Error', message: 'Not connected to ElevenLabs.', color: 'red' });
            return false;
        }

        try {
            const userMessage = createMessageObject('user', text);
            
            if (isMountedRef.current) {
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, userMessage],
                    isThinking: true
                }));
            }

            if (responseCallback) {
                responseCallbackRef.current = responseCallback;
                // Clear the callback after a timeout to avoid memory leaks
                setTimeout(() => {
                    responseCallbackRef.current = null;
                }, 30000);
            }

            console.log("Sending message to 11labs...");
            conversationRef.current.sendContextualUpdate(text);
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            notifications.show({ title: 'Error', message: 'Failed to send message.', color: 'red' });
            return false;
        }
    }, [createMessageObject]);

    const updateDynamicVariables = useCallback((newVariables: Record<string, any>): void => {
        if (!conversationRef.current || !conversationRef.current.isOpen || !conversationRef.current.isOpen()) {
            console.warn('Cannot update dynamic variables: not connected to ElevenLabs');
            return;
        }

        const safeVariables = sanitizeDynamicVariables(newVariables);

        try {
            console.log('Updating dynamic variables:', safeVariables);
            // Implementation for updating variables would go here if supported
        } catch (error) {
            console.error('Failed to update dynamic variables:', error);
        }
    }, []);

    const startRecording = useCallback(async (): Promise<boolean> => {
        if (state.isRecording) {
            console.log("Already recording");
            return true;
        }

        if (!conversationRef.current || !conversationRef.current.isOpen || !conversationRef.current.isOpen()) {
            console.log("Connection not ready, attempting to connect...");
            const connected = await startConversation();
            if (!connected) return false;
        }

        try {
            console.log("Starting audio recording");
            if (conversationRef.current) {
                conversationRef.current.setMicMuted(false);
            }
            return true;
        } catch (error) {
            console.error("Recording error:", error);
            notifications.show({ title: 'Recording Error', message: 'Could not start recording.', color: 'red' });
            return false;
        }
    }, [state.isRecording, startConversation]);

    const stopRecording = useCallback(() => {
        if (conversationRef.current && conversationRef.current.isOpen && conversationRef.current.isOpen()) {
            console.log("Stopping recording");
            conversationRef.current.setMicMuted(true);
        }
    }, []);

    const endConversation = useCallback(() => {
        console.log("Ending conversation and cleaning up");
        closeConnection();
        
        if (isMountedRef.current) {
            setState({
                messages: [],
                connectionState: ConnectionState.DISCONNECTED,
                error: null,
                isSpeaking: false,
                isRecording: false,
                isThinking: false,
                conversationId: null
            });
        }
    }, [closeConnection]);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            console.log("Component unmounting, cleaning up WebSocket resources");
            closeConnection();
        };
    }, [closeConnection]);

    const getInputAudioLevel = useCallback(() => {
        try {
            return conversationRef.current?.getInputVolume() || 0;
        } catch (error) {
            console.warn("Error getting input volume:", error);
            return 0;
        }
    }, []);
    
    const getOutputAudioLevel = useCallback(() => {
        try {
            return conversationRef.current?.getOutputVolume() || 0;
        } catch (error) {
            console.warn("Error getting output volume:", error);
            return 0;
        }
    }, []);
    
    const setVolume = useCallback((volume: number) => {
        try {
            if (conversationRef.current && conversationRef.current.isOpen && conversationRef.current.isOpen()) {
                conversationRef.current.setVolume({ volume });
            }
        } catch (error) {
            console.warn("Error setting volume:", error);
        }
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
        setVolume,
        updateDynamicVariables 
    };
};