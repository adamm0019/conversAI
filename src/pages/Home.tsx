import { AppShell } from '@mantine/core';
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
import { GlassUI } from '../components/GlassUI/GlassUI';
import EnhancedThinkingAnimation from '../components/ThinkingAnimation';
import { useFirebaseChat, Chat } from '../lib/firebase/firebaseConfig';
import { EnhancedConversationItem } from '../types/conversation';

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor');
    const { user, isLoaded } = useUser();

    const clientCanvasRef = useRef<HTMLCanvasElement>(null);
    const serverCanvasRef = useRef<HTMLCanvasElement>(null);

    const {
        profile,
        isLoading: profileLoading,
        getDynamicVariables
    } = useProfile();

    const {
        createNewChat,
        addMessageToChat,
        getUserChats,
        subscribeToChats,
        initializeFirebase,
        createUserProfile
    } = useFirebaseChat();

    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [allChats, setAllChats] = useState<Chat[]>([]);

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
        updateDynamicVariables
    } = useWebSocketConversation({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'struNpxnJkL8IlMMev4O',
        dynamicVariables: sanitizeDynamicVariables(getDynamicVariables()),
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received in hook callback:", message);
        }
    });

    useEffect(() => {
        if (user && isLoaded) {
            const setupFirebase = async () => {
                const isInitialized = await initializeFirebase();
                if (isInitialized) {
                    await createUserProfile({
                        email: user.primaryEmailAddress?.emailAddress || '',
                    });

                    subscribeToChats((chats) => {
                        setAllChats(chats);
                    });
                }
            };

            setupFirebase();
        }
    }, [user, isLoaded, initializeFirebase, createUserProfile, subscribeToChats]);

    useEffect(() => {
        if (profile && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(getDynamicVariables());
            updateDynamicVariables(variables);
        }
    }, [profile, connectionState, getDynamicVariables, updateDynamicVariables]);

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

    const handleDisconnect = useCallback(async (): Promise<void> => {
        console.log("Home: Disconnecting WebSocket");
        endConversation();
        return Promise.resolve();
    }, [endConversation]);

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

    const handleStopRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Stopping recording");
        stopRecording();
        return Promise.resolve();
    }, [stopRecording]);

    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        try {
            if (connectionState !== ConnectionState.CONNECTED) {
                console.log("Not connected, connecting first");
                await handleConnect();
            }

            const userMessageObj: EnhancedConversationItem = {
                id: Date.now().toString(),
                object: 'chat.completion',
                role: 'user',
                type: 'message',
                content: message,
                formatted: {
                    text: message,
                },
                created_at: new Date().toISOString(),
                timestamp: Date.now(),
                status: 'completed'
            };

            if (!activeChatId) {
                const newChatId = await createNewChat(userMessageObj);
                setActiveChatId(newChatId);
            } else {
                await addMessageToChat(activeChatId, userMessageObj);
            }

            const result = await sendMessage(message, (response) => {
                if (callback) callback(response);

                const assistantMessageObj: EnhancedConversationItem = {
                    id: Date.now().toString(),
                    object: 'chat.completion',
                    role: 'assistant',
                    type: 'message',
                    content: response,
                    formatted: {
                        text: response,
                    },
                    created_at: new Date().toISOString(),
                    timestamp: Date.now(),
                    status: 'completed'
                };

                if (activeChatId) {
                    addMessageToChat(activeChatId, assistantMessageObj);
                }
            });

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
    }, [connectionState, handleConnect, sendMessage, activeChatId, createNewChat, addMessageToChat]);

    const handleSelectChat = useCallback(async (chatId: string) => {
        setActiveChatId(chatId);
    }, []);

    const handleNewChat = useCallback(async () => {
        setActiveChatId(null);
    }, []);

    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection");
            endConversation();
        };
    }, [endConversation]);

    useEffect(() => {
        console.log("Connection state changed:", connectionState);
    }, [connectionState]);

    useEffect(() => {
        if (connectionState === ConnectionState.CONNECTED) {
            let animationFrame: number | null = null;

            const updateAudioLevels = () => {
                if (connectionState === ConnectionState.CONNECTED) {
                    const inputLevel = getInputAudioLevel();
                    const outputLevel = getOutputAudioLevel();

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

    const renderWelcomeMessage = () => {
        if (profileLoading) {
            return (
                <GlassUI p="lg" radius="lg" animate withHover style={{ textAlign: 'center' }}>
                    <EnhancedThinkingAnimation text="Loading your profile..." variant="rings" />
                </GlassUI>
            );
        }

        if (!profile) {
            return (
                <GlassUI p="lg" radius="lg" animate withHover style={{ textAlign: 'center' }}>
                    <div>Welcome to your language learning journey!</div>
                </GlassUI>
            );
        }

        const activeLanguage = profile.targetLanguages.length > 0
            ? profile.targetLanguages[0]
            : null;

        return (
            <GlassUI p="lg" radius="lg" animate withHover style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
                <h2>Welcome back, {profile.firstName || profile.displayName}!</h2>
                {activeLanguage && (
                    <div>
                        <p>Ready to continue your {activeLanguage.language} learning?</p>
                        <p>You're currently at {activeLanguage.level} level with {activeLanguage.progress}% progress.</p>
                        {activeLanguage.streak > 0 && (
                            <p>🔥 You're on a {activeLanguage.streak} day streak. Keep it up!</p>
                        )}
                    </div>
                )}
            </GlassUI>
        );
    };

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
                showSettings={true}
            />

            <AppShell.Main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 60px)',
                width: '100%'
            }}>
                <SignedIn>
                    {messages.length === 0 && connectionState !== ConnectionState.CONNECTED && (
                        <div style={{ padding: '2rem' }}>
                            {renderWelcomeMessage()}
                        </div>
                    )}

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
                        onNewChat={handleNewChat}
                        onSelectChat={handleSelectChat}
                        clientCanvasRef={clientCanvasRef}
                        serverCanvasRef={serverCanvasRef}
                        messages={messages}
                        conversationId={activeChatId}
                        chats={allChats}
                    />
                </SignedIn>
                <SignedOut>
                    <AuthOverlay />
                </SignedOut>
            </AppShell.Main>
        </AppShell>
    );
};