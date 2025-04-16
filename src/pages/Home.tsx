import { AppShell, LoadingOverlay } from '@mantine/core';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useWebSocketConversation } from '../hooks/useWebSocketConversation'; // Verify path
import EnhancedChatSection from '../components/ChatSection/EnhancedChatSection'; // Verify path
import { Header } from '../components/Header/Header'; // Verify path
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay'; // Verify path
import { ConnectionState } from '../types/connection'; // Verify path
import { notifications } from '@mantine/notifications';
import { useProfile } from '../contexts/ProfileContext'; // Verify path
import { sanitizeDynamicVariables } from '../types/dynamicVariables'; // Verify path

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor'); // Default mode
    const { user } = useUser();
    const { profile, isLoading: profileLoading, getDynamicVariables } = useProfile();

    // State to hold the current client audio level for visualization
    const [clientAudioLevel, setClientAudioLevel] = useState(0);

    // WebSocket Conversation Hook Setup
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
        getOutputAudioLevel, // Keep if used elsewhere
        updateDynamicVariables,
    } = useWebSocketConversation({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'struNpxnJkL8IlMMev4O', // Use environment variable
        dynamicVariables: profile ? sanitizeDynamicVariables(getDynamicVariables()) : {},
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received:", message);
        },
        // Add other hook options as needed
    });

    // Effect to update dynamic variables when profile changes
    useEffect(() => {
        if (profile && !profileLoading && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(getDynamicVariables());
            console.log("Home: Updating dynamic variables:", variables);
            updateDynamicVariables(variables);
        }
    }, [profile, profileLoading, connectionState, getDynamicVariables, updateDynamicVariables]);

    // --- Connection Management ---
    const ensureConnected = useCallback(async (): Promise<boolean> => {
        if (connectionState !== ConnectionState.CONNECTED) {
            console.log("Home: Not connected, attempting to connect...");
            try {
                await startConversation();
                // Connection attempt initiated. State will update via the hook.
                return true;
            } catch (err: any) {
                console.error("Connection error:", err);
                notifications.show({ title: 'Connection Error', message: err.message || 'Failed to connect to voice service.', color: 'red' });
                return false;
            }
        }
        // Return true if already connected or connection is in progress
        return connectionState === ConnectionState.CONNECTED;
    }, [connectionState, startConversation]);

    // --- Action Handlers ---
    const handleConnect = useCallback(async (): Promise<void> => { await ensureConnected(); }, [ensureConnected]);
    const handleDisconnect = useCallback(async (): Promise<void> => { endConversation(); }, [endConversation]);

    const handleStartRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Attempting to start recording");
        const connected = await ensureConnected();
        if (connected) {
            try {
                await startRecording();
                console.log("Home: Recording started successfully");
            } catch (err: any) {
                console.error("Start recording error:", err);
                notifications.show({ title: 'Microphone Error', message: err.message || 'Could not access microphone. Please check permissions.', color: 'red' });
            }
        } else {
            console.warn("Home: Cannot start recording, connection not ready.");
            notifications.show({ title: 'Not Connected', message: 'Please wait for connection before recording.', color: 'orange' });
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
                console.log("Message sent via hook, result:", result);
                // Check if sendMessage itself indicates an immediate failure (if applicable)
                if (result === false) { // Adjust based on sendMessage's return value
                    notifications.show({ title: 'Message Error', message: 'Failed to send message.', color: 'red' });
                }
            } catch (err: any) {
                console.error('Send message error:', err);
                notifications.show({ title: 'Message Error', message: err.message || 'Failed to send message.', color: 'red' });
            }
        } else {
            console.warn("Home: Cannot send message, connection not ready.");
            notifications.show({ title: 'Not Connected', message: 'Please wait for connection to send messages.', color: 'orange' });
        }
    }, [ensureConnected, sendMessage]);

    const handleNewChat = useCallback(async () => {
        console.log("Home: Starting new chat session");
        if (connectionState === ConnectionState.CONNECTED) {
            await handleDisconnect(); // Disconnect existing session
        }
        // Clear messages in the UI state via the hook
        // Optionally, auto-connect the new chat immediately:
        // await handleConnect();
    }, [connectionState, handleDisconnect]);

    const handleSelectChat = useCallback((chatId: string) => {
        console.log("Home: Selecting chat:", chatId);
        // --- Placeholder: Implement actual chat loading logic ---
        // 1. Compare chatId with current conversationId. If different:
        // 2. Call handleNewChat() to disconnect and clear current state.
        // 3. Fetch message history for `chatId` from your backend/storage.
        // 4. Update the `messages` state (likely via a setter from your hook or prop drilling).
        // 5. Potentially call `startConversation({ associatedConversationId: chatId })` if needed.
        notifications.show({ message: `Loading chat ${chatId}... (Implementation Pending)`, color: 'blue' });
        // --- End Placeholder ---
    }, [conversationId, handleNewChat]); // Add dependencies as needed

    // Effect for WebSocket cleanup on component unmount
    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection on unmount");
            endConversation();
        };
    }, [endConversation]);

    // Effect for updating audio level visualization state
    useEffect(() => {
        let animationFrame: number | null = null;
        // Only run the loop if the mic is actively recording
        if (isRecording) {
            const updateAudioLevels = () => {
                const inputLevel = getInputAudioLevel ? getInputAudioLevel() : 0; // Check if function exists
                setClientAudioLevel(inputLevel); // Update state for prop drilling
                animationFrame = requestAnimationFrame(updateAudioLevels);
            };
            animationFrame = requestAnimationFrame(updateAudioLevels);
        } else {
            // Reset level to 0 if not recording
            setClientAudioLevel(0);
        }
        // Cleanup function
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [isRecording, getInputAudioLevel]); // Rerun only when recording status changes


    return (
        <AppShell
            header={{ height: 60 }}
            padding={0}
            style={{ position: 'relative', height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--mantine-color-dark-9)' }}
        >
            <LoadingOverlay visible={profileLoading && !user} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onResetAPIKey={() => { /* Implement reset logic */ }}
                showSettings={true} // Or based on logic
            />

            {/* Main content area below the fixed header */}
            <AppShell.Main style={{ paddingTop: '60px', flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <SignedIn>
                    <EnhancedChatSection
                        connectionState={connectionState}
                        isThinking={isThinking}
                        isRecording={isRecording}
                        isSpeaking={isSpeaking}
                        audioLevel={clientAudioLevel} // Pass the client audio level
                        connectionError={error}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        onDisconnect={handleDisconnect}
                        onConnect={handleConnect}
                        onSendMessage={handleSendMessage}
                        onNewChat={handleNewChat}
                        onSelectChat={handleSelectChat}
                        onCloseChat={handleSelectChat} // Use specific handler if needed
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

// Ensure Home is exported if needed, adjust based on your routing setup
// export default Home;