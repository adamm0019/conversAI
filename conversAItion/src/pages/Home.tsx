// src/pages/Home.tsx
import { AppShell, LoadingOverlay } from '@mantine/core'; // Added LoadingOverlay
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useWebSocketConversation } from '../hooks/useWebSocketConversation';
import EnhancedChatSection from '../components/ChatSection/EnhancedChatSection';
import { Header } from '../components/Header/Header';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay';
import { ConnectionState } from '../types/connection';
import { notifications } from '@mantine/notifications';
import { useProfile } from '../contexts/ProfileContext';
import { sanitizeDynamicVariables } from '../types/dynamicVariables';
// Removed GlassUI and EnhancedThinkingAnimation imports if only used for the removed welcome message

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor'); // Or load from profile/settings

    // Refs for potential audio visualizations (kept but not used in current render)
    const clientCanvasRef = useRef<HTMLCanvasElement>(null);
    const serverCanvasRef = useRef<HTMLCanvasElement>(null);

    const { user } = useUser(); // Get Clerk user info if needed

    // Get user profile data and dynamic variables
    const {
        profile,
        isLoading: profileLoading,
        getDynamicVariables
    } = useProfile();

    // WebSocket Conversation Hook
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
        getOutputAudioLevel,
        updateDynamicVariables,
    } = useWebSocketConversation({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'struNpxnJkL8IlMMev4O',
        dynamicVariables: profile ? sanitizeDynamicVariables(getDynamicVariables()) : {}, // Pass empty if no profile yet
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received in hook callback:", message);
        },
        // Add other necessary options if your hook supports them
    });

    // Update dynamic variables when profile loads or changes while connected
    useEffect(() => {
        if (profile && !profileLoading && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(getDynamicVariables());
            console.log("Home: Updating dynamic variables:", variables);
            updateDynamicVariables(variables);
        }
    }, [profile, profileLoading, connectionState, getDynamicVariables, updateDynamicVariables]);

    // --- Connection & Action Handlers ---

    const ensureConnected = useCallback(async (): Promise<boolean> => {
        if (connectionState !== ConnectionState.CONNECTED) {
            console.log("Home: Not connected, attempting to connect...");
            try {
                await startConversation();
                // It might take a moment for the state to update,
                // consider awaiting a state change or adding a small delay if needed,
                // or rely on the hook to manage subsequent actions after connection.
                return true; // Indicate connection was initiated
            } catch (err: any) {
                console.error("Connection error:", err);
                notifications.show({
                    title: 'Connection Error',
                    message: err.message || 'Failed to connect to voice service',
                    color: 'red',
                });
                return false; // Indicate connection failed
            }
        }
        return connectionState === ConnectionState.CONNECTED; // Return true if already connected
    }, [connectionState, startConversation]);

    const handleConnect = useCallback(async (): Promise<void> => {
        await ensureConnected();
    }, [ensureConnected]);

    const handleDisconnect = useCallback(async (): Promise<void> => {
        console.log("Home: Disconnecting WebSocket");
        endConversation();
    }, [endConversation]);

    const handleStartRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Starting recording");
        const connected = await ensureConnected();
        if (connected) {
            try {
                await startRecording();
            } catch (err: any) {
                console.error("Recording error:", err);
                notifications.show({
                    title: 'Microphone Error',
                    message: err.message || 'Could not access microphone. Please check permissions.',
                    color: 'red',
                });
            }
        } else {
            console.warn("Home: Cannot start recording, connection not established.");
            // Optionally show a notification
        }
    }, [ensureConnected, startRecording]);

    const handleStopRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Stopping recording");
        stopRecording();
    }, [stopRecording]);

    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        const connected = await ensureConnected();
        if (connected) {
            try {
                const result = await sendMessage(message, callback);
                console.log("Message sent to WebSocket, result:", result);
                if (!result) { // Check if sendMessage indicates failure
                    notifications.show({
                        title: 'Message Error',
                        message: 'Failed to send message.',
                        color: 'red',
                    });
                }
            } catch (err: any) {
                console.error('Failed to send message:', err);
                notifications.show({
                    title: 'Message Error',
                    message: err.message || 'Failed to send message.',
                    color: 'red',
                });
                // Optionally re-throw or handle differently
            }
        } else {
            console.warn("Home: Cannot send message, connection not established.");
            notifications.show({
                title: 'Not Connected',
                message: 'Please wait for the connection to establish.',
                color: 'orange',
            });
        }
    }, [ensureConnected, sendMessage]);

    // Handler for creating a new chat session
    const handleNewChat = useCallback(async () => {
        console.log("Home: Starting new chat session");
        // 1. End the current conversation (if active)
        if (connectionState === ConnectionState.CONNECTED) {
            await handleDisconnect();
        }
    }, [connectionState, handleDisconnect]);

    // Handler for selecting an existing chat (Placeholder - requires logic to load chat history)
    const handleSelectChat = useCallback((chatId: string) => {
        console.log("Home: Selecting chat:", chatId);
        // TODO:
        // 1. End current connection if active and different chat.
        // 2. Fetch messages for `chatId` from Firebase/storage.
        // 3. Update the `messages` state managed by the hook (or parent).
        // 4. Potentially start a new connection associated with this `conversationId`.
        notifications.show({ message: `Loading chat ${chatId}... (Not Implemented)`, color: 'blue' });
        // Example: If switching, clear current state and connect
        // if (chatId !== conversationId) {
        //    handleNewChat().then(() => {
        //       // setMessages(fetchedMessages); // Update local message state
        //       // startConversation({ associatedConversationId: chatId }); // Reconnect if needed
        //    });
        // }
    }, [conversationId, handleNewChat]); // Add dependencies as needed


    // Clean up connection on unmount
    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection on unmount");
            endConversation();
        };
    }, [endConversation]);

    // --- Audio Level Visualization (Kept logic, but rendering removed from this component) ---
    useEffect(() => {
        let animationFrame: number | null = null;
        if (connectionState === ConnectionState.CONNECTED) {
            const updateAudioLevels = () => {
                const inputLevel = getInputAudioLevel();
                const outputLevel = getOutputAudioLevel();
                // console.log(`Input: ${inputLevel.toFixed(2)}, Output: ${outputLevel.toFixed(2)}`); // Debugging
                // Update canvas refs if they were being used for visualization elsewhere
                animationFrame = requestAnimationFrame(updateAudioLevels);
            };
            animationFrame = requestAnimationFrame(updateAudioLevels);
        }
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [connectionState, getInputAudioLevel, getOutputAudioLevel]);


    return (
        <AppShell
            header={{ height: 60 }}
            padding={0} // No padding for AppShell itself
            style={{
                position: 'relative', // Changed from 'fixed'
                height: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden', // Prevent body scroll
                backgroundColor: 'var(--mantine-color-dark-9)' // Ensure bg color
            }}
        >
            {/* Loading overlay while profile is loading */}
            <LoadingOverlay
                visible={profileLoading && !user} // Show only initially while profile and user context load
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />

            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onResetAPIKey={() => {}} // Implement if needed
                showSettings={true} // Or control based on state/props
            />

            <AppShell.Main style={{
                flex: 1, // Takes remaining height
                height: 'calc(100vh - 60px)', // Explicit height calculation
                overflow: 'hidden', // Prevent double scrollbars
                display: 'flex', // Needed for flex child
                flexDirection: 'column',
                position: 'relative', // Ensure context for absolutely positioned children if any
            }}>
                <SignedIn>
                    {/* EnhancedChatSection now handles its own empty state */}
                    <EnhancedChatSection
                        connectionState={connectionState}
                        isThinking={isThinking}
                        isRecording={isRecording}
                        isSpeaking={isSpeaking}
                        connectionError={error}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        onDisconnect={handleDisconnect} // Pass disconnect if needed (e.g., manual disconnect button)
                        onConnect={handleConnect} // Pass connect if needed (e.g., manual connect button)
                        onSendMessage={handleSendMessage}
                        onNewChat={handleNewChat} // Pass new chat handler
                        onSelectChat={handleSelectChat} // Pass select chat handler
                        onCloseChat={handleSelectChat} // Or specific archive/delete handler
                        // Pass refs only if needed by ChatSection or sub-components for visualization
                        // clientCanvasRef={clientCanvasRef}
                        // serverCanvasRef={serverCanvasRef}
                        messages={messages}
                        conversationId={conversationId} // Pass current conversation ID
                    />
                </SignedIn>
                <SignedOut>
                    {/* AuthOverlay should cover the main area */}
                    <AuthOverlay />
                </SignedOut>
            </AppShell.Main>
        </AppShell>
    );
};