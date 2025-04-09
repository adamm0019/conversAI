// src/hooks/useEnhancedWebSocketConversation.ts
import { useCallback, useState, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Conversation, Options, Status, Mode } from '@11labs/client';
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
    agentId?: string;
    apiKey?: string;
    autoReconnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    onMessageReceived?: (message: EnhancedConversationItem) => void;
}

// Map 11labs status to our ConnectionState
const mapStatusToConnectionState = (status: Status): ConnectionState => {
    switch (status) {
        case 'connecting':
            return ConnectionState.CONNECTING;
        case 'connected':
            return ConnectionState.CONNECTED;
        case 'disconnecting':
            // Use RECONNECTING as we don't have a DISCONNECTING state
            return ConnectionState.RECONNECTING;
        case 'disconnected':
            return ConnectionState.DISCONNECTED;
        default:
            return ConnectionState.DISCONNECTED;
    }
};

export const useEnhancedWebSocketConversation = (options: WebSocketHookOptions) => {
    // Default options
    const {
        agentId = 'LclYQZaTV1A9E1fgKwF9',
        apiKey,
        autoReconnect = true,
        onMessageReceived
    } = options;

    // Get API key from environment if not provided in options
    const apiKeyToUse = apiKey || import.meta.env.VITE_ELEVEN_LABS_API_KEY;

    // State
    const [state, setState] = useState<WebSocketHookState>({
        messages: [],
        connectionState: ConnectionState.DISCONNECTED,
        error: null,
        isSpeaking: false,
        isRecording: false,
        isThinking: false,
        conversationId: null
    });

    // Refs
    const conversationRef = useRef<Conversation | null>(null);
    const reconnectCountRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef<boolean>(false);
    const responseCallbackRef = useRef<((message: EnhancedConversationItem) => void) | null>(null);

    // Create a conversation message object
    const createMessageObject = useCallback((role: 'user' | 'assistant', content: string): EnhancedConversationItem => {
        return {
            id: Date.now().toString(),
            object: 'conversation.message',
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

    // Handle disconnection and cleanup
    const closeConnection = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (conversationRef.current) {
            conversationRef.current.endSession()
                .catch(err => console.error('Error ending session:', err));
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

    // Start conversation (connect to 11labs)
    const startConversation = useCallback(async (): Promise<boolean> => {
        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current) {
            console.log('Connection already in progress, ignoring request');
            return false;
        }

        if (conversationRef.current && conversationRef.current.isOpen()) {
            console.log('Conversation already connected');
            return true;
        }

        // Check if we have an API key
        if (!apiKeyToUse) {
            console.error('No ElevenLabs API key provided. Please set the VITE_ELEVEN_LABS_API_KEY environment variable.');
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.ERROR,
                error: 'No ElevenLabs API key provided'
            }));
            notifications.show({
                title: 'Configuration Error',
                message: 'Missing ElevenLabs API key. Please check your environment variables.',
                color: 'red',
            });
            return false;
        }

        isConnectingRef.current = true;

        try {
            setState(prev => ({
                ...prev,
                connectionState: ConnectionState.CONNECTING,
                error: null
            }));

            console.log('Creating ElevenLabs conversation...');
            console.log('Agent ID:', agentId);

            const handleMessage = (props: { message: string, source: 'user' | 'ai' }) => {
                console.log(`Received message from ${props.source}:`, props.message);

                // Create conversation item
                const role = props.source === 'ai' ? 'assistant' : 'user';
                const newMessage = createMessageObject(role, props.message);

                // Update state with the new message
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMessage],
                    isThinking: false
                }));

                // Call message callback if provided
                if (onMessageReceived && props.source === 'ai') {
                    onMessageReceived(newMessage);
                }

                // If there's a one-time response callback, call it and clear
                if (responseCallbackRef.current && props.source === 'ai') {
                    responseCallbackRef.current(newMessage);
                    responseCallbackRef.current = null;
                }
            };

            // Configure the 11labs client based on SessionConfig requirements
            const conversationOptions = {
                // Authentication
                authorization: apiKeyToUse,           // API key without Bearer prefix
                
                // Agent ID is required when not using signedUrl
                agentId,
                
                // Optional configuration for better experience
                overrides: {
                    agent: {
                        // Default language
                        language: "en"
                    },
                    tts: {
                        // Default voice
                        voiceId: "21m00Tcm4TlvDq8ikWAM"  // Rachel voice
                    }
                },

                // Callbacks
                onConnect: ({ conversationId }) => {
                    console.log('Connected to ElevenLabs conversation:', conversationId);
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.CONNECTED,
                        error: null,
                        conversationId
                    }));
                    reconnectCountRef.current = 0; // Reset reconnect counter
                    isConnectingRef.current = false;
                },
                onDisconnect: () => {
                    console.log('Disconnected from ElevenLabs conversation');
                    setState(prev => ({
                        ...prev,
                        connectionState: ConnectionState.DISCONNECTED,
                        isSpeaking: false,
                        isRecording: false,
                        isThinking: false
                    }));
                },
                onMessage: handleMessage,
                onAudio: (base64Audio) => {
                    console.log('Received audio data of length:', base64Audio.length);
                },
                onError: (message, context) => {
                    console.error('ElevenLabs error:', message, context);
                    setState(prev => ({
                        ...prev,
                        error: message,
                        connectionState: ConnectionState.ERROR
                    }));
                    notifications.show({
                        title: 'Connection Error',
                        message,
                        color: 'red',
                    });
                    isConnectingRef.current = false;
                },
                onStatusChange: ({ status }) => {
                    console.log('ElevenLabs status changed:', status);
                    setState(prev => ({
                        ...prev,
                        connectionState: mapStatusToConnectionState(status)
                    }));
                },
                onModeChange: ({ mode }) => {
                    console.log('ElevenLabs mode changed:', mode);
                    setState(prev => ({
                        ...prev,
                        isSpeaking: mode === 'speaking',
                        isRecording: mode === 'listening'
                    }));
                },
                onDebug: (props) => {
                    console.debug('ElevenLabs debug:', props);
                    if (props.type === 'thinking') {
                        setState(prev => ({
                            ...prev,
                            isThinking: true
                        }));
                    }
                },
                onCanSendFeedbackChange: () => {
                    // We don't use this currently
                },

                // Client tools configuration (required but empty)
                clientTools: {}
            };

            // Create and start the conversation
            // The startSession static method handles creating and initializing the conversation
            const conversation = await Conversation.startSession(conversationOptions);
            conversationRef.current = conversation;

            return true;
        } catch (error) {
            console.error('Connection error:', error);

            // Check for authorization errors specifically
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';

            if (errorMessage.includes('authorize') ||
                errorMessage.includes('authentication') ||
                errorMessage.includes('token') ||
                errorMessage.includes('API key')) {
                console.error('API key authentication failed. Please check your ElevenLabs API key.');

                setState(prev => ({
                    ...prev,
                    connectionState: ConnectionState.ERROR,
                    error: 'Authentication failed. Please check your ElevenLabs API key.'
                }));

                notifications.show({
                    title: 'Authentication Error',
                    message: 'Your ElevenLabs API key appears to be invalid. Please check your settings.',
                    color: 'red',
                });
            } else {
                setState(prev => ({
                    ...prev,
                    connectionState: ConnectionState.ERROR,
                    error: errorMessage
                }));
            }

            isConnectingRef.current = false;

            // Handle reconnection if enabled
            if (autoReconnect && reconnectCountRef.current < (options.reconnectAttempts || 5)) {
                reconnectCountRef.current += 1;
                const delay = (options.reconnectDelay || 3000) * reconnectCountRef.current;

                console.log(`Reconnecting (${reconnectCountRef.current}/${options.reconnectAttempts || 5}) in ${delay}ms...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    startConversation();
                }, delay);
            }

            return false;
        }
    }, [apiKeyToUse, agentId, autoReconnect, createMessageObject, onMessageReceived, options.reconnectAttempts, options.reconnectDelay]);

    // Send text message
    const sendMessage = useCallback(async (text: string, responseCallback?: (response: string) => void): Promise<boolean> => {
        if (!conversationRef.current || !conversationRef.current.isOpen()) {
            console.error('Conversation not connected');
            notifications.show({
                title: 'Connection Error',
                message: 'Not connected to ElevenLabs. Please try again.',
                color: 'red',
            });
            return false;
        }

        try {
            console.log('Sending message:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

            // Create a conversation item for the user message
            const userMessage = createMessageObject('user', text);

            // Update state with the new message
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, userMessage],
                isThinking: true
            }));

            // Set up a one-time response handler if needed
            if (responseCallback) {
                responseCallbackRef.current = (message: EnhancedConversationItem) => {
                    responseCallback(message.content as string);
                };

                // Set a timeout to clear the callback if no response is received
                setTimeout(() => {
                    responseCallbackRef.current = null;
                }, 30000); // 30 second timeout
            }

            // Send the message using sendContextualUpdate
            conversationRef.current.sendContextualUpdate(text);

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to send message. Please try again.',
                color: 'red',
            });
            return false;
        }
    }, [createMessageObject]);

    // Start recording
    const startRecording = useCallback(async (): Promise<boolean> => {
        console.log('Starting recording...');
        if (state.isRecording) {
            console.log('Already recording, ignoring request');
            return true;
        }

        if (!conversationRef.current || !conversationRef.current.isOpen()) {
            try {
                console.log('Conversation not connected, connecting first...');
                const connected = await startConversation();
                if (!connected) {
                    console.error('Failed to connect conversation');
                    return false;
                }
            } catch (error) {
                console.error('Failed to connect before recording:', error);
                return false;
            }
        }

        try {
            setState(prev => ({ ...prev, isRecording: true }));

            // Start recording by unmuting the microphone
            if (conversationRef.current) {
                conversationRef.current.setMicMuted(false);
            }
            console.log('Recording started');

            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            setState(prev => ({ ...prev, isRecording: false }));

            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                notifications.show({
                    title: 'Microphone Access Denied',
                    message: 'Please allow microphone access to use voice chat.',
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Recording Error',
                    message: error instanceof Error ? error.message : 'Failed to start recording',
                    color: 'red',
                });
            }

            return false;
        }
    }, [state.isRecording, startConversation]);

    // Stop recording
    const stopRecording = useCallback((): void => {
        console.log('Stopping recording...');
        if (conversationRef.current && state.isRecording) {
            // Mute the microphone to stop recording
            conversationRef.current.setMicMuted(true);
            setState(prev => ({ ...prev, isRecording: false }));
        }
    }, [state.isRecording]);

    // End conversation
    const endConversation = useCallback((): void => {
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
        console.log('Conversation ended and state reset');
    }, [closeConnection]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            closeConnection();
        };
    }, [closeConnection]);

    // Log connection state changes
    useEffect(() => {
        console.log('WebSocket connection state:', state.connectionState);
    }, [state.connectionState]);

    // Get audio visualization data
    const getInputAudioLevel = useCallback((): number => {
        if (!conversationRef.current) return 0;
        return conversationRef.current.getInputVolume();
    }, []);

    const getOutputAudioLevel = useCallback((): number => {
        if (!conversationRef.current) return 0;
        return conversationRef.current.getOutputVolume();
    }, []);

    // Set audio volume
    const setVolume = useCallback((volume: number): void => {
        if (conversationRef.current) {
            conversationRef.current.setVolume({ volume });
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
        setVolume
    };
};