import { AppShell } from '@mantine/core';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWebSocketConversation } from '../hooks/useWebSocketConversation';
import ChatSection from '../components/ChatSection/ChatSection';
import { Header } from '../components/Header/Header';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay';
import { ConnectionState } from '../types/connection';
import { notifications } from '@mantine/notifications';
import { useProfile } from '../contexts/ProfileContext';
import { sanitizeDynamicVariables } from '../types/dynamicVariables';
import { useAzurePronunciation, FeedbackType } from '../services/AzurePronunciationService';
import { ConversationItem } from '../types/conversation';
import { Box, rem } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useFirebaseChatService } from '../services/FirebaseChatService';
import { useUserProfile } from '../contexts/UserProfileContext';


const darkBg = '#141417';
const cardBg = 'rgba(30, 31, 40, 0.7)';
const accentBlue = '#4195d3';
const accentPurple = '#8366d1';

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor');
    const { user } = useAuth();
    const { profile, isLoading: profileLoading, getDynamicVariables } = useProfile();
    const { createNewChat, addMessageToChat, getChatMessages } = useFirebaseChatService();
    const { userProfile } = useUserProfile();


    const [currentChatId, setCurrentChatId] = useState<string | null>(null);


    const [clientAudioLevel, setClientAudioLevel] = useState(0);

    const [outputAudioLevel, setOutputAudioLevel] = useState(0);


    const [isPronunciationMode, setIsPronunciationMode] = useState(false);
    const [currentReferenceText, setCurrentReferenceText] = useState<string | null>(null);


    const lastAudioDataRef = useRef<ArrayBuffer | null>(null);


    const {
        assessPronunciation,
        generateLanguageFeedback,
        generateAchievementFeedback
    } = useAzurePronunciation();

    const getDefaultDynamicVariables = useCallback(() => {

        const userName = user?.displayName || user?.email?.split('@')[0] || 'there';


        let defaults: {
            user_name: string;
            subscription_tier: string;
            language_level: string;
            target_language: string;
            days_streak: number;
            vocabulary_mastered: number;
            grammar_mastered: number;
            total_progress: number;
            motivation?: string;
            [key: string]: any;
        } = {
            user_name: userName,
            subscription_tier: 'standard',
            language_level: 'beginner',
            target_language: 'Spanish',
            days_streak: 0,
            vocabulary_mastered: 0,
            grammar_mastered: 0,
            total_progress: 0
        };


        if (userProfile) {

            if (userProfile.settings?.preferredLanguage) {
                const preferredLang = userProfile.settings.preferredLanguage;
                defaults.target_language = preferredLang.charAt(0).toUpperCase() + preferredLang.slice(1);


                if (userProfile.languages && userProfile.languages[preferredLang]) {
                    const langProgress = userProfile.languages[preferredLang];
                    defaults.language_level = langProgress.proficiencyLevel;


                    defaults.vocabulary_mastered = langProgress.wordsLearned;
                    defaults.total_progress = Math.floor(langProgress.experiencePoints / 100);
                }
            }


            if (userProfile.streak) {
                defaults.days_streak = userProfile.streak.currentStreak;
            }


            if (userProfile.userPreferences?.motivation) {
                defaults.motivation = userProfile.userPreferences.motivation;
            }
        }

        return sanitizeDynamicVariables({ ...defaults, ...(profile?.dynamicVariables || {}) });
    }, [user, profile, userProfile]);


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
        dynamicVariables: getDefaultDynamicVariables(),
        autoReconnect: true,
        onMessageReceived: (message) => {


            checkForPronunciationPrompt(message);
        },
    });


    useEffect(() => {
        if (profile && !profileLoading && connectionState === ConnectionState.CONNECTED) {
            const variables = sanitizeDynamicVariables(profile.dynamicVariables || {});

            updateDynamicVariables(variables);
        }
    }, [profile, profileLoading, connectionState, updateDynamicVariables]);


    const saveAIResponseToFirebase = useCallback(async (message: ConversationItem) => {
        if (currentChatId && message.role === 'assistant') {
            try {
                await addMessageToChat(currentChatId, message);

            } catch (error) {

            }
        }
    }, [currentChatId, addMessageToChat]);


    useEffect(() => {

        const latestMessage = [...messages].reverse().find(m => m.role === 'assistant');

        if (latestMessage && currentChatId) {
            saveAIResponseToFirebase(latestMessage);
        }
    }, [messages, currentChatId, saveAIResponseToFirebase]);


    const ensureConnected = useCallback(async (): Promise<boolean> => {
        if (connectionState !== ConnectionState.CONNECTED) {

            try {
                await startConversation();
                return true;
            } catch (err: any) {

                notifications.show({ title: 'Connection Error', message: err.message || 'Failed to connect to voice service.', color: 'red' });
                return false;
            }
        }
        return connectionState === ConnectionState.CONNECTED;
    }, [connectionState, startConversation]);


    const checkForPronunciationPrompt = useCallback((message: ConversationItem) => {
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



                setCurrentReferenceText(referenceText);
                setIsPronunciationMode(true);
            }
        }
    }, [profile?.dynamicVariables?.target_language]);


    const handleConnect = useCallback(async (): Promise<void> => { await ensureConnected(); }, [ensureConnected]);
    const handleDisconnect = useCallback(async (): Promise<void> => { endConversation(); }, [endConversation]);


    const handleStartRecording = useCallback(async (): Promise<void> => {

        const connected = await ensureConnected();
        if (connected) {
            try {
                await startRecording();


            } catch (err: any) {

                notifications.show({ title: 'Microphone Error', message: err.message || 'Could not access microphone. Please check permissions.', color: 'red' });
            }
        } else {
            notifications.show({ title: 'Not Connected', message: 'Please wait for connection before recording.', color: 'orange' });
        }
    }, [ensureConnected, startRecording]);


    const handleStopRecording = useCallback(async (): Promise<void> => {

        stopRecording();


        if (isPronunciationMode && currentReferenceText && lastAudioDataRef.current) {
            try {



                const userLanguage = profile?.dynamicVariables?.target_language?.toString().toLowerCase() || 'en-US';

                const locale = userLanguage.includes('-') ? userLanguage : `${userLanguage}-${userLanguage.toUpperCase()}`;


                const { result, feedback } = await assessPronunciation(
                    lastAudioDataRef.current,
                    currentReferenceText,
                    locale
                );




                setIsPronunciationMode(false);
                setCurrentReferenceText(null);

            } catch (error) {

                notifications.show({
                    title: 'Assessment Error',
                    message: 'Could not assess pronunciation. Please try again.',
                    color: 'red'
                });


                setIsPronunciationMode(false);
                setCurrentReferenceText(null);
            }
        }
    }, [stopRecording, isPronunciationMode, currentReferenceText, profile, assessPronunciation]);


    const handleSendMessage = useCallback(async (message: string, callback?: (response: string) => void): Promise<void> => {

        const connected = await ensureConnected();
        if (connected) {
            try {



                let feedbackType: 'grammar' | 'vocabulary' = Math.random() > 0.5 ? 'grammar' : 'vocabulary';
                const feedback = generateLanguageFeedback(message, feedbackType);


                const customMessage: ConversationItem = {
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


                let chatId = currentChatId;
                if (!chatId) {
                    try {

                        chatId = await createNewChat(customMessage);
                        if (chatId) {
                            setCurrentChatId(chatId);
                        } else {

                            notifications.show({ title: 'Error', message: 'Failed to create new chat', color: 'red' });
                            return;
                        }
                    } catch (error) {

                        notifications.show({ title: 'Error', message: 'Failed to create new chat', color: 'red' });
                        return;
                    }
                } else {

                    try {
                        await addMessageToChat(chatId, customMessage);

                    } catch (error) {

                        notifications.show({ title: 'Error', message: 'Failed to save message', color: 'red' });
                    }
                }


                const result = await sendMessage(message, (response) => {

                    if (chatId) {
                        const aiMessage: ConversationItem = {
                            id: `ai-${Date.now()}`,
                            object: 'chat.completion',
                            role: 'assistant',
                            type: 'message',
                            content: response,
                            formatted: { text: response },
                            created_at: new Date().toISOString(),
                            timestamp: Date.now(),
                            status: 'completed'
                        };

                        addMessageToChat(chatId, aiMessage)
                            .catch(err => console.error("Failed to save AI response:", err));
                    }

                    if (callback) callback(response);
                });



                if (result === false) {
                    notifications.show({ title: 'Message Error', message: 'Failed to send message.', color: 'red' });
                }
            } catch (err: any) {

                notifications.show({ title: 'Message Error', message: err.message || 'Failed to send message.', color: 'red' });
            }
        } else {
            notifications.show({ title: 'Not Connected', message: 'Please wait for connection to send messages.', color: 'orange' });
        }
    }, [ensureConnected, sendMessage, generateLanguageFeedback, currentChatId, createNewChat, addMessageToChat]);

    const handleNewChat = useCallback(async () => {



        setCurrentChatId(null);

        if (connectionState === ConnectionState.CONNECTED) {
            await handleDisconnect();
        }


        setIsPronunciationMode(false);
        setCurrentReferenceText(null);


    }, [connectionState, handleDisconnect]);

    const handleSelectChat = useCallback(async (chatId: string) => {



        setCurrentChatId(chatId);


        try {

            notifications.show({ message: `Loading chat...`, color: 'blue', loading: true, id: 'loading-chat' });


            const messages = await getChatMessages(chatId);



            notifications.update({
                id: 'loading-chat',
                message: 'Chat loaded successfully',
                color: 'green',
                loading: false,
                autoClose: 2000
            });
        } catch (error) {

            notifications.update({
                id: 'loading-chat',
                message: 'Failed to load chat messages',
                color: 'red',
                loading: false,
                autoClose: 2000
            });
        }

    }, [getChatMessages]);


    const processAudioData = useCallback((audioData: ArrayBuffer) => {
        lastAudioDataRef.current = audioData;
    }, []);


    useEffect(() => {
        return () => {

            endConversation();
        };
    }, [endConversation]);


    useEffect(() => {
        const updateAudioLevels = () => {

            const inputLevel = getInputAudioLevel();
            if (typeof inputLevel === 'number') {
                setClientAudioLevel(inputLevel);
            }


            const outputLevel = getOutputAudioLevel();
            if (typeof outputLevel === 'number') {
                setOutputAudioLevel(outputLevel);
            }

            requestAnimationFrame(updateAudioLevels);
        };

        updateAudioLevels();

        return () => {


        };
    }, [getInputAudioLevel, getOutputAudioLevel]);


    useEffect(() => {
        if (profile?.dynamicVariables?.days_streak) {
            const streakValue = Number(profile.dynamicVariables.days_streak);


            if (streakValue === 3 || streakValue === 7 || streakValue === 14 || streakValue === 30) {
                const streakFeedback = generateAchievementFeedback();


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
            styles={(theme) => ({
                main: {
                    backgroundColor: darkBg,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'hidden',
                },
            })}
        >
            <Header
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                showSettings={true}
            />

            <AuthOverlay />

            <Box
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 60px)',
                    position: 'relative',
                    marginTop: '60px'
                }}
            >
                <ChatSection
                    messages={messages}
                    isThinking={isThinking}
                    connectionState={connectionState}
                    isRecording={isRecording}
                    isSpeaking={isSpeaking}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onSendMessage={handleSendMessage}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    audioLevel={clientAudioLevel}
                    connectionError={error}
                    conversationId={currentChatId || conversationId}
                    onSelectChat={handleSelectChat}
                    onCloseChat={(id) => {
                        if (id === currentChatId) {
                            setCurrentChatId(null);
                        }

                    }}
                    onNewChat={handleNewChat}
                />
            </Box>
        </AppShell>
    );
};

export default Home;