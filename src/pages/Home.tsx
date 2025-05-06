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
import { useAzurePronunciation, FeedbackType } from '../services/AzurePronunciationService'; 
import { EnhancedConversationItem } from '../types/conversation'; 
import { useStreak } from '../hooks/useStreak'; 
import { Box, rem } from '@mantine/core';

// Color constants to match dashboard styling
const darkBg = '#141417';
const cardBg = 'rgba(30, 31, 40, 0.7)';
const accentBlue = '#4195d3';
const accentPurple = '#8366d1';

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor'); 
    const { user } = useUser();
    const { profile, isLoading: profileLoading, getDynamicVariables } = useProfile();
    const { updateStreak } = useStreak(); 

    // Client audio level state
    const [clientAudioLevel, setClientAudioLevel] = useState(0);

    // Pronunciation mode state
    const [isPronunciationMode, setIsPronunciationMode] = useState(false);
    const [currentReferenceText, setCurrentReferenceText] = useState<string | null>(null);

    // Store the last audio data for pronunciation assessment
    const lastAudioDataRef = useRef<ArrayBuffer | null>(null);

    // Initialize Azure pronunciation service
    const {
        assessPronunciation,
        generateLanguageFeedback,
        generateAchievementFeedback
    } = useAzurePronunciation();

    const getDefaultDynamicVariables = useCallback(() => {
        const defaults = {
            user_name: user?.firstName || 'there',
            subscription_tier: 'standard',
            language_level: 'beginner',
            target_language: 'Spanish',
            days_streak: 0,
            vocabulary_mastered: 0,
            grammar_mastered: 0,
            total_progress: 0
        };
        
        return sanitizeDynamicVariables({ ...defaults, ...(profile?.dynamicVariables || {}) });
    }, [user, profile]);

    // Initialize WebSocket conversation with dynamic variables
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
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'JLN0MSwr6AtVxCQM32XU', 
        dynamicVariables: getDefaultDynamicVariables(),
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received:", message);
            
            checkForPronunciationPrompt(message);
        },
    });

    // Update dynamic variables when profile loads or changes
    useEffect(() => {
        if (profile && !profileLoading && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(profile.dynamicVariables || {});
            console.log("Home: Updating dynamic variables:", variables);
            updateDynamicVariables(variables);
        }
    }, [profile, profileLoading, connectionState, updateDynamicVariables]);

    // Ensure connection is established
    const ensureConnected = useCallback(async (): Promise<boolean> => {
        if (connectionState !== ConnectionState.CONNECTED) {
            console.log("Home: Not connected, attempting to connect...");
            try {
                await startConversation();
                return true;
            } catch (err: any) {
                console.error("Connection error:", err);
                notifications.show({ title: 'Connection Error', message: err.message || 'Failed to connect to voice service.', color: 'red' });
                return false;
            }
        }
        return connectionState === ConnectionState.CONNECTED;
    }, [connectionState, startConversation]);

    // Check if message is requesting pronunciation practice
    const checkForPronunciationPrompt = useCallback((message: EnhancedConversationItem) => {
        if (message.role !== 'assistant') return;

        // Get message text
        const text = typeof message.content === 'string'
            ? message.content
            : message.formatted?.text || '';

        // Check if this is a practice prompt
        const isPracticePrompt = /repeat after me|practice saying|pronounce this|try saying/i.test(text);

        if (isPracticePrompt) {
            // Try to extract the text to practice
            const promptRegex = /(["'])(.*?)\1/; 
            const match = text.match(promptRegex);

            if (match && match[2]) {
                // Found reference text
                const referenceText = match[2].trim();
                console.log("Found reference text for pronunciation practice:", referenceText);

                // Set pronunciation mode
                setCurrentReferenceText(referenceText);
                setIsPronunciationMode(true);
            }
        }
    }, [profile?.dynamicVariables?.target_language]);

    // Connection management handlers
    const handleConnect = useCallback(async (): Promise<void> => { await ensureConnected(); }, [ensureConnected]);
    const handleDisconnect = useCallback(async (): Promise<void> => { endConversation(); }, [endConversation]);

    // Recording handlers
    const handleStartRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Attempting to start recording");
        const connected = await ensureConnected();
        if (connected) {
            try {
                await startRecording();
                console.log("Home: Recording started successfully");
                
                updateStreak();
            } catch (err: any) {
                console.error("Start recording error:", err);
                notifications.show({ title: 'Microphone Error', message: err.message || 'Could not access microphone. Please check permissions.', color: 'red' });
            }
        } else {
            console.warn("Home: Cannot start recording, connection not ready.");
            notifications.show({ title: 'Not Connected', message: 'Please wait for connection before recording.', color: 'orange' });
        }
    }, [ensureConnected, startRecording, updateStreak]);

    // Stop recording handler
    const handleStopRecording = useCallback(async (): Promise<void> => {
        console.log("Home: Stopping recording");
        stopRecording();

        // Handle pronunciation mode
        if (isPronunciationMode && currentReferenceText && lastAudioDataRef.current) {
            try {
                console.log("Assessing pronunciation...");

                // Get user language for pronunciation assessment
                const userLanguage = profile?.dynamicVariables?.target_language?.toString().toLowerCase() || 'en-US';
                
                const locale = userLanguage.includes('-') ? userLanguage : `${userLanguage}-${userLanguage.toUpperCase()}`;

                // Assess pronunciation
                const { result, feedback } = await assessPronunciation(
                    lastAudioDataRef.current,
                    currentReferenceText,
                    locale
                );

                console.log("Pronunciation assessment result:", result);
                console.log("Feedback:", feedback);

                // Reset pronunciation mode
                setIsPronunciationMode(false);
                setCurrentReferenceText(null);

            } catch (error) {
                console.error("Pronunciation assessment error:", error);
                notifications.show({
                    title: 'Assessment Error',
                    message: 'Could not assess pronunciation. Please try again.',
                    color: 'red'
                });

                // Reset pronunciation mode
                setIsPronunciationMode(false);
                setCurrentReferenceText(null);
            }
        }
    }, [stopRecording, isPronunciationMode, currentReferenceText, profile, assessPronunciation]);

    // Message sending handler
    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        const connected = await ensureConnected();
        if (connected) {
            try {
                // Update streak when user sends a message
                updateStreak();
                
                // Generate feedback for demo purposes
                let feedbackType: 'grammar' | 'vocabulary' = Math.random() > 0.5 ? 'grammar' : 'vocabulary';
                const feedback = generateLanguageFeedback(message, feedbackType);

                // Create a custom message with feedback
                const customMessage: EnhancedConversationItem = {
                    id: Date.now().toString(),
                    object: 'chat.completion',
                    role: 'user',
                    type: 'message',
                    content: message,
                    formatted: { text: message },
                    created_at: new Date().toISOString(),
                    timestamp: Date.now(),
                    status: 'completed',
                    feedback 
                };

                // Send message through the WebSocket service
                const result = await sendMessage(message, callback);
                console.log("Message sent via hook, result:", result);

                // Handle failure
                if (result === false) { 
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
    }, [ensureConnected, sendMessage, generateLanguageFeedback, updateStreak]);

    const handleNewChat = useCallback(async () => {
        console.log("Home: Starting new chat session");
        if (connectionState === ConnectionState.CONNECTED) {
            await handleDisconnect(); 
        }

        // Reset pronunciation mode
        setIsPronunciationMode(false);
        setCurrentReferenceText(null);

        // Update streak when starting a new chat
        updateStreak();
    }, [connectionState, handleDisconnect, updateStreak]);

    const handleSelectChat = useCallback((chatId: string) => {
        console.log("Home: Selecting chat:", chatId);
        
        updateStreak();
        notifications.show({ message: `Loading chat ${chatId}... (Implementation Pending)`, color: 'blue' });
    }, [updateStreak]); 

    // Process audio data for later use
    const processAudioData = useCallback((audioData: ArrayBuffer) => {
        lastAudioDataRef.current = audioData;
    }, []);

    // Clean up WebSocket connection when component unmounts
    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection on unmount");
            endConversation();
        };
    }, [endConversation]);

    // Update audio levels for visualization
    useEffect(() => {
        let animationFrame: number | null = null;
        
        if (isRecording) {
            const updateAudioLevels = () => {
                const inputLevel = getInputAudioLevel ? getInputAudioLevel() : 0; 
                setClientAudioLevel(inputLevel); 
                animationFrame = requestAnimationFrame(updateAudioLevels);
            };
            animationFrame = requestAnimationFrame(updateAudioLevels);
        } else {
            setClientAudioLevel(0);
        }
        
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [isRecording, getInputAudioLevel]); 

    // Check for streak achievements
    useEffect(() => {
        if (profile?.dynamicVariables?.days_streak) {
            const streakValue = Number(profile.dynamicVariables.days_streak);

            // Show notifications for milestone streaks
            if (streakValue === 3 || streakValue === 7 || streakValue === 14 || streakValue === 30) {
                const streakFeedback = generateAchievementFeedback('streak', streakValue);

                // Display notification
                notifications.show({
                    title: streakFeedback.message,
                    message: streakFeedback.details || '',
                    color: 'orange',
                    autoClose: 5000
                });
            }
        }
    }, [profile?.dynamicVariables?.days_streak, generateAchievementFeedback]);

    return (
        <AppShell
            header={{ height: 60 }}
            padding={0}
            style={{
                position: 'relative',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                backgroundColor: darkBg,
            }}
        >
            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onResetAPIKey={() => {}}
                showSettings={true}
            />

            <AppShell.Main style={{ 
                height: 'calc(100vh - 60px)', 
                backgroundColor: darkBg,
                backgroundImage: 'radial-gradient(circle at top right, rgba(80, 100, 240, 0.08) 0%, transparent 80%)',
                overflowY: 'auto'
            }}>
                {/* Decorative background elements */}
                <Box
                    style={{
                        position: 'absolute',
                        top: rem(-80),
                        right: rem(-80),
                        width: rem(400),
                        height: rem(400),
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(70, 90, 180, 0.05) 0%, transparent 70%)`,
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />

                <Box
                    style={{
                        position: 'absolute',
                        bottom: rem(-100),
                        left: rem(-100),
                        width: rem(300),
                        height: rem(300),
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(70, 90, 180, 0.05) 0%, transparent 70%)`,
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />

                <Box
                    py="xl"
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <SignedIn>
                        <EnhancedChatSection
                            connectionState={connectionState}
                            isThinking={isThinking}
                            isRecording={isRecording}
                            isSpeaking={isSpeaking}
                            audioLevel={clientAudioLevel}
                            connectionError={error}
                            onStartRecording={handleStartRecording}
                            onStopRecording={handleStopRecording}
                            onDisconnect={handleDisconnect}
                            onConnect={handleConnect}
                            onSendMessage={handleSendMessage}
                            onNewChat={handleNewChat}
                            onSelectChat={handleSelectChat}
                            onCloseChat={handleSelectChat}
                            messages={messages}
                            conversationId={conversationId}
                        />
                    </SignedIn>
                    <SignedOut>
                        <AuthOverlay />
                    </SignedOut>
                </Box>
            </AppShell.Main>
        </AppShell>
    );
};

export default Home;