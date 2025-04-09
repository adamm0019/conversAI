import { AppShell } from '@mantine/core';
import React, { useRef, useState, useEffect } from 'react';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useWebSocketConversation } from '../hooks/useWebSocketConversation';
import { ChatSection } from '../components/ChatSection/ChatSection';
import { Header } from '../components/Header/Header';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay';
import { EnhancedConversationItem } from '../types/conversation';

export const Home: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState('tutor');
    const [messages, setMessages] = useState<EnhancedConversationItem[]>([]);
    const [isRecording, setIsRecording] = useState(false);

    const {
        isConnected,
        isInitializing,
        isLoading,
        error,
        isSpeaking,
        startConversation,
        endConversation,
        sendMessage,
        messages: conversationMessages,
        startRecording,
        stopRecording
    } = useWebSocketConversation();

    const clientCanvasRef = useRef<HTMLCanvasElement>(null);
    const serverCanvasRef = useRef<HTMLCanvasElement>(null);

    // converting messages to new enhanced conversation items
    useEffect(() => {
        if (conversationMessages.length > 0) {
            const enhancedMessages: EnhancedConversationItem[] = conversationMessages.map(msg => ({
                id: msg.id,
                object: 'conversation.message',
                role: msg.role,
                type: 'message',
                content: msg.content,
                formatted: {
                    text: msg.content,
                },
                created_at: new Date(msg.timestamp).toISOString(),
                timestamp: msg.timestamp,
                status: 'completed'
            }));
            setMessages(enhancedMessages);
        }
    }, [conversationMessages]);

    const handleStartRecording = async () => {
        try {
            if (!isConnected) {
                await startConversation();
            }
            await startRecording();
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
        }
    };

    const handleStopRecording = async () => {
        try {
            await stopRecording();
            setIsRecording(false);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const [isThinking, setIsThinking] = useState(false);

    const handleSendMessage = async (message: string, callback?: (response: string) => void) => {
        try {
            if (!isConnected) {
                await startConversation();
            }
            sendMessage(message);

            // adding the user's messages to the chat
            const enhancedMessage: EnhancedConversationItem = {
                id: Date.now().toString(),
                object: 'conversation.message',
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
            setMessages(prev => [...prev, enhancedMessage]);

            // response listener
            if (callback) {
                const waitForResponse = () => {
                    const lastMessage = conversationMessages[conversationMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                        callback(lastMessage.content);
                    } else {
                        setTimeout(waitForResponse, 100); // Check again in 100ms
                    }
                };
                waitForResponse();
            }

        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };
    // connection cleanup
    useEffect(() => {
        return () => {
            endConversation();
        };
    }, [endConversation]);

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
                onResetAPIKey={() => { }}
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
                    <ChatSection
                        items={messages}
                        isConnected={isConnected}
                        isRecording={isRecording || isSpeaking}
                        isInitializing={isInitializing || isLoading}
                        connectionError={error}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        onDisconnect={endConversation}
                        onConnect={startConversation}
                        onSendMessage={handleSendMessage}
                        onNewChat={() => {
                            if (!isConnected) {
                                startConversation();
                            }
                        }}
                        clientCanvasRef={clientCanvasRef}
                        serverCanvasRef={serverCanvasRef}
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