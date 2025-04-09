import { AppShell } from '@mantine/core';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEnhancedWebSocketConversation } from '../hooks/useEnhancedWebSocketConversation';
import { EnhancedChatSection } from '../components/ChatSection/EnhancedChatSection';
import { Header } from '../components/Header/Header';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay';
import { ConnectionState } from '../types/connection';
import { notifications } from '@mantine/notifications';

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor');

    const clientCanvasRef = useRef<HTMLCanvasElement>(null);
    const serverCanvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize 11labs conversation with the official client library
    const {
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
        getOutputAudioLevel
    } = useEnhancedWebSocketConversation({
        // Agent configuration
        agentId: 'TaDOThYRtPGeAcPDnfys', // Your ElevenLabs agent ID
        apiKey: import.meta.env.VITE_ELEVEN_LABS_API_KEY,
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received in hook callback:", message);
        }
    });

    // Wrapper for startConversation that returns void
    const handleConnect = useCallback(async (): Promise<void> => {
        try {
            console.log("Home: Connecting to WebSocket");
            await startConversation();
        } catch (error) {
            console.error("Connection error:", error);
            notifications.show({
                title: 'Connection Error',
                message: error instanceof Error ? error.message : 'Failed to connect to voice service',
                color: 'red',
            });
        }
    }, [startConversation]);

    // Wrapper for endConversation that returns Promise<void>
    const handleDisconnect = useCallback(async (): Promise<void> => {
        console.log("Home: Disconnecting WebSocket");
        endConversation();
        return Promise.resolve(); // Make sure it returns a Promise<void>
    }, [endConversation]);

    // Handle start recording with proper connection check
    const handleStartRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Starting recording");
        try {
            if (connectionState !== ConnectionState.CONNECTED) {
                console.log("Not connected, connecting first");
                await handleConnect();
            }
            await startRecording();
        } catch (error) {
            console.error("Recording error:", error);
            notifications.show({
                title: 'Microphone Error',
                message: 'Could not access microphone. Please check your browser permissions.',
                color: 'red',
            });
        }
    }, [connectionState, handleConnect, startRecording]);

    // Handle stop recording
    const handleStopRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Stopping recording");
        stopRecording();
        return Promise.resolve();
    }, [stopRecording]);

    // Send a text message
    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        try {
            if (connectionState !== ConnectionState.CONNECTED) {
                console.log("Not connected, connecting first");
                await handleConnect();
            }

            const result = await sendMessage(message, callback);
            console.log("Message sent to WebSocket, result:", result);

            if (!result) {
                notifications.show({
                    title: 'Message Error',
                    message: 'Failed to send message. Please try again.',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            notifications.show({
                title: 'Message Error',
                message: 'Failed to send message. Please try again.',
                color: 'red',
            });
        }
    }, [connectionState, handleConnect, sendMessage]);

    // Clean up connection on unmount
    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection");
            endConversation();
        };
    }, [endConversation]);

    // For debugging - log when connection state changes
    useEffect(() => {
        console.log("Connection state changed:", connectionState);
    }, [connectionState]);

    // Set up audio level visualization
    useEffect(() => {
        if (connectionState === ConnectionState.CONNECTED) {
            let animationFrame: number | null = null;

            const updateAudioLevels = () => {
                // Only update visualizations if connected
                if (connectionState === ConnectionState.CONNECTED) {
                    // Get audio levels from the conversation
                    const inputLevel = getInputAudioLevel();
                    const outputLevel = getOutputAudioLevel();

                    // Draw visualizations if needed
                    // For debugging
                    if (isRecording || isSpeaking) {
                        console.log(`Audio levels - Input: ${inputLevel.toFixed(2)}, Output: ${outputLevel.toFixed(2)}`);
                    }

                    animationFrame = requestAnimationFrame(updateAudioLevels);
                }
            };

            animationFrame = requestAnimationFrame(updateAudioLevels);

            return () => {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
            };
        }
    }, [connectionState, getInputAudioLevel, getOutputAudioLevel, isRecording, isSpeaking]);

    return (
        <AppShell
            header={{ height: 60 }}
            padding={0}
            style={{
                position: 'relative',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
            }}
        >
            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onResetAPIKey={() => {}}
                showSettings={false}
            />

            <AppShell.Main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 60px)',
                width: '100%'
            }}>
                <SignedIn>
                    <EnhancedChatSection
                        connectionState={connectionState}
                        isThinking={isThinking}
                        isRecording={isRecording}
                        isSpeaking={isSpeaking}
                        connectionError={error}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        onDisconnect={handleDisconnect}
                        onConnect={handleConnect}
                        onSendMessage={handleSendMessage}
                        onNewChat={handleConnect}
                        clientCanvasRef={clientCanvasRef}
                        serverCanvasRef={serverCanvasRef}
                        messages={messages}
                        conversationId={conversationId}
                    />
                </SignedIn>
                <SignedOut>
                    <AuthOverlay />
                </SignedOut>
            </AppShell.Main>
        </AppShell>
    );
};