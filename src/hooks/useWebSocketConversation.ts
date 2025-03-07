import { useCallback, useState, useRef, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    timestamp: number;
}

interface ConversationState {
    messages: Message[];
    isConnected: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;
    isSpeaking: boolean;
}

export const useWebSocketConversation = () => {
    const [state, setState] = useState<ConversationState>({
        messages: [],
        isConnected: false,
        isLoading: false,
        isInitializing: false,
        error: null,
        isSpeaking: false,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const AGENT_ID = 'LclYQZaTV1A9E1fgKwF9';
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    const RECONNECT_DELAY = 3000; // 3 seconds

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const clearHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = undefined;
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        clearHeartbeat();
        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, HEARTBEAT_INTERVAL);
    }, [clearHeartbeat]);

    const closeWebSocket = useCallback(() => {
        clearHeartbeat();
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isConnected: false,
            isLoading: false,
            isSpeaking: false
        }));
    }, [clearHeartbeat]);
    
    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            const audioContext = initAudioContext();
            const audioData = Buffer.from(base64Audio, 'base64');
            const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.start(0);
            setState(prev => ({ ...prev, isSpeaking: true }));

            source.onended = () => {
                setState(prev => ({ ...prev, isSpeaking: false }));
            };
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }, [initAudioContext]);

    const getSignedUrl = async () => {
        const response = await fetch(`${import.meta.env.VITE_ELEVEN_SERVER_URL}/api/get-signed-url`);
        if (!response.ok) {
            throw new Error('Failed to get signed URL');
        }
        const data = await response.json();
        return data.signedUrl;
    };

    const startConversation = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const signedUrl = await getSignedUrl();

            wsRef.current = new WebSocket(signedUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                startHeartbeat();
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    isLoading: false,
                    error: null
                }));
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'heartbeat_ack') {
                        return;
                    }

                    if (data.type === 'agent_response' && data.agent_response_event?.agent_response) {
                        const newMessage: Message = {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: data.agent_response_event.agent_response,
                            timestamp: Date.now(),
                        };
                        setState(prev => ({
                            ...prev,
                            messages: [...prev.messages, newMessage]
                        }));
                    }

                    if (data.type === 'audio' && data.audio_event?.audio) {
                        await playAudio(data.audio_event.audio);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Connection error',
                    isConnected: false,
                    isLoading: false
                }));
                closeWebSocket();
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket closed');
                closeWebSocket();

                // Attempt to reconnect
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    startConversation();
                }, RECONNECT_DELAY);
            };

        } catch (error) {
            console.error('Connection error:', error);
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Connection failed',
                isLoading: false
            }));
            throw error;
        }
    }, [closeWebSocket, playAudio, startHeartbeat]);

    const sendMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            notifications.show({
                title: 'Connection Error',
                message: 'Not connected to server. Please try again.',
                color: 'red',
            });
            return;
        }

        try {
            wsRef.current.send(JSON.stringify({
                text,
                type: 'text'
            }));

            const userMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: text,
                timestamp: Date.now(),
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, userMessage]
            }));
        } catch (error) {
            console.error('Error sending message:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to send message. Please try again.',
                color: 'red',
            });
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const arrayBuffer = await event.data.arrayBuffer();
                    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            audio_data: base64Audio,
                            type: 'audio_data'
                        }));
                    }
                }
            };

            mediaRecorder.start(100);
            setState(prev => ({ ...prev, isRecording: true }));
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setState(prev => ({ ...prev, isRecording: false }));
    }, []);

    const endConversation = useCallback(async (): Promise<void> => {
        return new Promise((resolve) => {
            closeWebSocket();
            resolve();
        });
    }, [closeWebSocket]);

    useEffect(() => {
        return () => {
            closeWebSocket();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [closeWebSocket]);

    return {
        ...state,
        startConversation,
        endConversation,
        sendMessage,
        startRecording,
        stopRecording
    };
};