import { AppShell, LoadingOverlay } from '@mantine/core';
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

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor'); 
    const { user } = useUser();
    const { profile, isLoading: profileLoading, getDynamicVariables } = useProfile();

    
    const [clientAudioLevel, setClientAudioLevel] = useState(0);

    
    const [isPronunciationMode, setIsPronunciationMode] = useState(false);
    const [currentReferenceText, setCurrentReferenceText] = useState<string | null>(null);

    
    const lastAudioDataRef = useRef<ArrayBuffer | null>(null);

    
    const {
        assessPronunciation,
        generateLanguageFeedback,
        generateAchievementFeedback
    } = useAzurePronunciation();

    
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
        dynamicVariables: profile ? sanitizeDynamicVariables(getDynamicVariables()) : {},
        autoReconnect: true,
        onMessageReceived: (message) => {
            console.log("Message received:", message);

            
            checkForPronunciationPrompt(message);
        },
        
    });

    
    useEffect(() => {
        if (profile && !profileLoading && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(getDynamicVariables());
            console.log("Home: Updating dynamic variables:", variables);
            updateDynamicVariables(variables);
        }
    }, [profile, profileLoading, connectionState, getDynamicVariables, updateDynamicVariables]);

    
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

    
    const checkForPronunciationPrompt = useCallback((message: EnhancedConversationItem) => {
        if (message.role !== 'assistant') return;

        
        const text = typeof message.content === 'string'
            ? message.content
            : message.formatted?.text || '';

        
        const isPracticePrompt = /repeat after me|practice saying|pronounce this|try saying/i.test(text);

        if (isPracticePrompt) {
            
            const promptRegex = /(["'])(.*?)\1/; 
            const match = text.match(promptRegex);

            if (match && match[2]) {
                
                const referenceText = match[2].trim();
                console.log("Found reference text for pronunciation practice:", referenceText);

                
                setCurrentReferenceText(referenceText);
                setIsPronunciationMode(true);

                
                const referenceMessage: EnhancedConversationItem = {
                    id: Date.now().toString(),
                    object: 'chat.completion',
                    role: 'assistant',
                    type: 'message',
                    content: referenceText,
                    formatted: {
                        text: referenceText,
                    },
                    created_at: new Date().toISOString(),
                    timestamp: Date.now(),
                    status: 'completed',
                    referenceText: referenceText, 
                    language: profile?.dynamicVariables?.target_language?.toString().toLowerCase() || 'en-US'
                };

                
                
                
            }
        }
    }, [profile?.dynamicVariables?.target_language]);

    
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

        
        if (isPronunciationMode && currentReferenceText && lastAudioDataRef.current) {
            try {
                console.log("Assessing pronunciation...");

                
                const userLanguage = profile?.dynamicVariables?.target_language?.toString().toLowerCase() || 'en-US';
                
                const locale = userLanguage.includes('-') ? userLanguage : `${userLanguage}-${userLanguage.toUpperCase()}`;

                
                const { result, feedback } = await assessPronunciation(
                    lastAudioDataRef.current,
                    currentReferenceText,
                    locale
                );

                console.log("Pronunciation assessment result:", result);
                console.log("Feedback:", feedback);

                
                const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
                if (lastUserMessageIndex >= 0) {
                    const userMessageIndex = messages.length - 1 - lastUserMessageIndex;
                    const updatedMessage = {
                        ...messages[userMessageIndex],
                        feedback
                    };

                    
                    
                    
                    
                    
                    
                    
                }

                
                setIsPronunciationMode(false);
                setCurrentReferenceText(null);

            } catch (error) {
                console.error("Pronunciation assessment error:", error);
                notifications.show({
                    title: 'Assessment Error',
                    message: 'Could not assess pronunciation. Please try again.',
                    color: 'red'
                });

                
                setIsPronunciationMode(false);
                setCurrentReferenceText(null);
            }
        }
    }, [stopRecording, isPronunciationMode, currentReferenceText, profile, messages, assessPronunciation]);

    
    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {
        console.log("Home: Sending message:", message);
        const connected = await ensureConnected();
        if (connected) {
            try {
                
                let feedbackType: 'grammar' | 'vocabulary' = Math.random() > 0.5 ? 'grammar' : 'vocabulary';
                const feedback = generateLanguageFeedback(message, feedbackType);

                
                
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

                
                const result = await sendMessage(message, callback);
                console.log("Message sent via hook, result:", result);

                
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
    }, [ensureConnected, sendMessage, generateLanguageFeedback]);

    const handleNewChat = useCallback(async () => {
        console.log("Home: Starting new chat session");
        if (connectionState === ConnectionState.CONNECTED) {
            await handleDisconnect(); 
        }

        
        setIsPronunciationMode(false);
        setCurrentReferenceText(null);

        
        
        
    }, [connectionState, handleDisconnect]);

    const handleSelectChat = useCallback((chatId: string) => {
        console.log("Home: Selecting chat:", chatId);
        
        
        
        
        
        
        notifications.show({ message: `Loading chat ${chatId}... (Implementation Pending)`, color: 'blue' });
        
    }, [conversationId, handleNewChat]); 

    
    const processAudioData = useCallback((audioData: ArrayBuffer) => {
        lastAudioDataRef.current = audioData;
    }, []);

    
    useEffect(() => {
        return () => {
            console.log("Home: Cleaning up WebSocket connection on unmount");
            endConversation();
        };
    }, [endConversation]);

    
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

    
    useEffect(() => {
        if (profile?.dynamicVariables?.days_streak) {
            const streakValue = Number(profile.dynamicVariables.days_streak);

            
            if (streakValue === 3 || streakValue === 7 || streakValue === 14 || streakValue === 30) {
                const streakFeedback = generateAchievementFeedback('streak', streakValue);

                
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
            style={{ position: 'relative', height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--mantine-color-dark-9)' }}
        >
            <LoadingOverlay visible={profileLoading && !user} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                onResetAPIKey={() => {}}
                showSettings={true}
            />

            {/* Main content area below the fixed header */}
            <AppShell.Main style={{ paddingTop: '60px', flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
            </AppShell.Main>
        </AppShell>
    );
};

export default Home;