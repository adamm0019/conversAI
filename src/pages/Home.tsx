import { AppShell } from '@mantine/core';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useEnhancedWebSocketConversation } from '../hooks/useEnhancedWebSocketConversation';
import { EnhancedChatSection } from '../components/ChatSection/EnhancedChatSection';
import { Header } from '../components/Header/Header';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay';
import { ConnectionState } from '../types/connection';

// Safe environment variable retrieval for Vite
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env[name] as string) || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || defaultValue;
  }
  return defaultValue;
};

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
        // Get API key directly from the environment
        apiKey: import.meta.env.VITE_ELEVEN_LABS_API_KEY || '',
        agentId: 'TaDOThYRtPGeAcPDnfys',
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received in hook callback:", message);
        }
    });
    
    // Log environment variables to help debug
    useEffect(() => {
        console.log('Environment variables check:');
        console.log('VITE_ELEVEN_LABS_API_KEY present:', !!import.meta.env.VITE_ELEVEN_LABS_API_KEY);
        // Log first and last few characters if present
        if (import.meta.env.VITE_ELEVEN_LABS_API_KEY) {
            const key = import.meta.env.VITE_ELEVEN_LABS_API_KEY as string;
            console.log('API key format:', `${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
        }
    }, []);

    // Wrapper for startConversation that returns void
    const handleConnect = useCallback(async (): Promise<void> => {
        console.log("Home: Connecting to WebSocket");
        await startConversation();
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
        if (connectionState !== ConnectionState.CONNECTED) {
            console.log("Not connected, connecting first");
            await handleConnect();
        }
        await startRecording();
    }, [connectionState, handleConnect, startRecording]);

    // Handle stop recording
    const handleStopRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Stopping recording");
        stopRecording();
    }, [stopRecording]);

    // Send a text message
    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        try {
            if (connectionState !== ConnectionState.CONNECTED) {
                console.log("Not connected, connecting first");
                await handleConnect();
            }

            // Create a callback handler that will be passed to sendMessage
            const messageHandler = (msg: any) => {
                if (msg.role === 'assistant') {
                    console.log("Response received in Home component:", msg);
                    
                    // Extract the content - handle different possible formats
                    let content: string;
                    if (typeof msg.content === 'string') {
                        content = msg.content;
                    } else if (msg.formatted?.text) {
                        content = msg.formatted.text;
                    } else if (msg.formatted?.transcript) {
                        content = msg.formatted.transcript;
                    } else {
                        content = "Unable to display response content";
                        console.error("Unexpected message format:", msg);
                    }
                    
                    console.log("Extracted content:", content.substring(0, 30) + "...");
                    
                    // Call the callback with the extracted content
                    if (callback) {
                        console.log("Calling provided callback with extracted content");
                        callback(content);
                    }
                }
            };

            // Pass the message to the WebSocket with the enhanced message handler
            console.log("Sending message to WebSocket with callback handler");
            const result = await sendMessage(message, messageHandler);
            console.log("Message sent to WebSocket, result:", result);
            
        } catch (error) {
            console.error('Failed to send message:', error);
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
    
    // Audio level tracking for visualizations
    useEffect(() => {
        if (connectionState === ConnectionState.CONNECTED) {
            const updateAudioLevels = () => {
                const inputLevel = getInputAudioLevel();
                const outputLevel = getOutputAudioLevel();
                
                // Update visualizations here if needed
                console.log(`Audio levels - Input: ${inputLevel}, Output: ${outputLevel}`);
                
                if (connectionState === ConnectionState.CONNECTED) {
                    requestAnimationFrame(updateAudioLevels);
                }
            };
            
            requestAnimationFrame(updateAudioLevels);
        }
    }, [connectionState, getInputAudioLevel, getOutputAudioLevel]);

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

export default Home;