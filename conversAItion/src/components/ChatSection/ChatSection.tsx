import React, { useRef, useEffect, useState } from 'react';
import { Stack, Group, Text, Transition, Box, Loader, Center, TextInput, ActionIcon, Button } from '@mantine/core';
import {
    IconMicrophone,
    IconPlayerStop,
    IconPaperclip,
    IconArrowUp,
    IconPlugConnected,
    IconMessageCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUser } from "@clerk/clerk-react";
import { EnhancedConversationItem } from '../../types/conversation';
import { ThinkingAnimation } from '../ThinkingAnimation';
import { MessageBubble } from './MessageBubble';
import { styles, slideIn } from './styles';
import { ChatShelf } from './ChatShelf';
import { useFirebaseChat } from '../../lib/firebase/firebaseConfig';

interface ChatSectionProps {
    items: EnhancedConversationItem[];
    isConnected: boolean;
    isRecording: boolean;
    isThinking?: boolean;
    isInitializing?: boolean;
    connectionError?: string | null;
    onStartRecording: () => Promise<void>;
    onStopRecording: () => Promise<void>;
    onDisconnect: () => Promise<void>;
    onConnect: () => Promise<void>;
    onSendMessage: (message: string, callback?: (response: string) => void) => Promise<void>;
    onNewChat?: () => void;
    clientCanvasRef: React.RefObject<HTMLCanvasElement>;
    serverCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
    items,
    isConnected,
    isRecording,
    isInitializing = false,
    connectionError = null,
    onStartRecording,
    onStopRecording,
    onDisconnect,
    onConnect,
    onSendMessage: parentOnSendMessage,
    onNewChat,
    clientCanvasRef,
    serverCanvasRef,
}) => {
    const [mounted, setMounted] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<EnhancedConversationItem[]>([]);

    const { user } = useUser();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        createNewChat,
        addMessageToChat,
        markChatAsRead,
        subscribeToChats
    } = useFirebaseChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToChats((chats) => {
            if (activeChat) {
                const currentChat = chats.find(chat => chat.id === activeChat);
                if (currentChat) {
                    setCurrentMessages(currentChat.messages);
                }
            }
        });

        return () => unsubscribe();
    }, [activeChat]);

    const handleStartChat = async () => {
        try {
            setIsConnecting(true);
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // creating new chat - fix logic to auto connect later
            const newChatId = await createNewChat();
            setActiveChat(newChatId);
            setCurrentMessages([]);  // setting chat view to initialise with empty messages

            // connecting to websocket if i need to
            if (!isConnected) {
                await onConnect();
            }

        } catch (error) {
            console.error('Failed to start new chat:', error);
            notifications.show({
                title: 'Error',
                message: error instanceof Error ? error.message : 'Failed to start new chat',
                color: 'red',
            });
        } finally {
            setIsConnecting(false);
        }
    };
    const handleSendMessage = async () => {
        if (!message.trim() || isSending) return;

        try {
            setIsSending(true);
            if (!isConnected) {
                await onConnect();
            }

            setIsThinking(true);

            const newMessage: EnhancedConversationItem = {
                role: 'user',
                content: message,
                timestamp: Date.now(),
                id: Date.now().toString(),
                status: 'completed',
                object: 'chat.completion',
                type: 'message',
                formatted: {
                    text: message,
                    transcript: message
                },
                created_at: new Date().toISOString()
            };

            if (!activeChat) {
                const chatId = await createNewChat(newMessage);
                setActiveChat(chatId);
            } else {
                await addMessageToChat(activeChat, newMessage);
            }

            await parentOnSendMessage(message, async (response) => {
                const aiMessage: EnhancedConversationItem = {
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now(),
                    id: Date.now().toString(),
                    status: 'completed',
                    object: 'chat.completion',
                    type: 'message',
                    formatted: {
                        text: response,
                        transcript: response
                    },
                    created_at: new Date().toISOString()
                };

                if (activeChat) {
                    await addMessageToChat(activeChat, aiMessage);
                }
            });

            setMessage('');
            inputRef.current?.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
            notifications.show({
                title: 'Message Error',
                message: 'Failed to send message. Please try again.',
                color: 'red',
            });
        } finally {
            setIsSending(false);
            setIsThinking(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleRecordingClick = async () => {
        try {
            if (!isConnected) {
                await onConnect();
                return;
            }

            if (isRecording) {
                await onStopRecording();
            } else {
                await onStartRecording();
            }
        } catch (error) {
            console.error('Recording operation failed:', error);
            notifications.show({
                title: 'Recording Error',
                message: 'Failed to manage recording. Please try again.',
                color: 'red',
            });
        }
    };

    const handleChatSelect = async (chatId: string) => {
        setActiveChat(chatId);
        await markChatAsRead(chatId);
    };

    const handleChatClose = (chatId: string) => {
        if (activeChat === chatId) {
            setActiveChat(null);
            setCurrentMessages([]);
        }
    };

    const getIcon = () => {
        if (isConnecting || isInitializing) {
            return <Loader size="xs" />;
        }
        if (isRecording) {
            return <IconPlayerStop size={20} />;
        }
        if (!isConnected) {
            return <IconPlugConnected size={20} />;
        }
        return <IconMicrophone size={20} />;
    };

    const renderMessages = () => {
        let currentDate = '';

        return currentMessages.map((item, index) => {
            const messageDate = new Date(item.timestamp).toLocaleDateString();
            const showDateDivider = messageDate !== currentDate;
            currentDate = messageDate;

            return (
                <React.Fragment key={item.id || index}>
                    {showDateDivider && (
                        <Box style={styles.dateDivider}>
                            <Text size="sm" c="dimmed" span style={styles.dateBadge}>
                                {messageDate}
                            </Text>
                        </Box>
                    )}
                    <Transition
                        mounted={mounted}
                        transition="slide-up"
                        duration={400}
                        timingFunction="ease-out"
                        exitDuration={200}
                    >
                        {(transitionStyles) => (
                            <Box style={{ ...transitionStyles, animation: `${slideIn} 0.3s ease-out`, width: '100%' }}>
                                <Box style={styles.messageGroup}>
                                    <MessageBubble item={item} />
                                    {index === currentMessages.length - 1 && isThinking && item.role === 'user' && (
                                        <Box mt="md" ml="md">
                                            <ThinkingAnimation />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Transition>
                </React.Fragment>
            );
        });
    };

    return (
        <Box style={styles.container}>
            <ChatShelf
                activeChat={activeChat || ''}
                onSelectChat={handleChatSelect}
                onCloseChat={handleChatClose}
                onNewChat={handleStartChat}
            />
            <Box style={styles.chatArea}>
                <Box style={styles.messageContainer}>
                    {currentMessages.length === 0 ? (
                        <Center style={{ height: 'calc(100vh - 200px)' }}>
                            <Stack align="center" m="md">
                                <Text size="xl" fw={600} c="dimmed">Hi {user?.firstName}! 👋</Text>
                                {isInitializing ? (
                                    <Stack align="center" m="md">
                                        <Loader size="sm" />
                                        <Text size="sm" c="dimmed">Connecting...</Text>
                                    </Stack>
                                ) : connectionError ? (
                                    <Stack align="center" m="md">
                                        <Text size="sm" c="red">Connection failed: {connectionError}</Text>
                                        <Button
                                            leftSection={<IconMessageCircle size={20} />}
                                            variant="light"
                                            color="blue"
                                            onClick={handleStartChat}
                                            loading={isConnecting}
                                        >
                                            Try again
                                        </Button>
                                    </Stack>
                                ) : !isConnected ? (
                                    <Stack align="center" m="md">
                                        <Text size="sm" c="dimmed" ta="center" maw={600}>
                                            Ready to chat! You can type a message or use the microphone to speak.
                                        </Text>
                                        <Button
                                            leftSection={<IconMessageCircle size={20} />}
                                            variant="light"
                                            color="blue"
                                            onClick={handleStartChat}
                                            loading={isConnecting}
                                        >
                                            Start new chat
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Text size="sm" c="dimmed" ta="center" maw={600}>
                                        Ready to chat! You can type a message or use the microphone to speak.
                                    </Text>
                                )}
                            </Stack>
                        </Center>
                    ) : (
                        <Stack m="xl">
                            {renderMessages()}
                            <div ref={messagesEndRef} />
                        </Stack>
                    )}
                </Box>
            </Box>

            {isConnected && (
                <Box style={styles.inputContainer}>
                    <Box style={styles.inputWrapper}>
                        <Box style={styles.inputInner}>
                            <Stack m="sm">
                                <Box hiddenFrom="sm">
                                    <Group justify="center" gap="md">
                                        <Box style={{ position: 'relative' }}>
                                            <canvas
                                                ref={clientCanvasRef}
                                                height={40}
                                                width={80}
                                                style={styles.canvas}
                                            />
                                            {isRecording && (
                                                <Loader size="xs" color="blue" style={styles.loaderOverlay} />
                                            )}
                                        </Box>
                                        <Box style={{ position: 'relative' }}>
                                            <canvas
                                                ref={serverCanvasRef}
                                                height={40}
                                                width={80}
                                                style={styles.canvas}
                                            />
                                            {isConnected && (
                                                <Loader size="xs" color="blue" style={styles.loaderOverlay} />
                                            )}
                                        </Box>
                                    </Group>
                                </Box>

                                <Box visibleFrom="sm" style={styles.visualizersDesktop}>
                                    <Group gap="xl">
                                        <Box style={{ position: 'relative' }}>
                                            <canvas
                                                ref={clientCanvasRef}
                                                height={40}
                                                width={100}
                                                style={styles.canvas}
                                            />
                                            {isRecording && (
                                                <Loader size="xs" color="blue" style={styles.loaderOverlay} />
                                            )}
                                        </Box>
                                        <Box style={{ position: 'relative' }}>
                                            <canvas
                                                ref={serverCanvasRef}
                                                height={40}
                                                width={100}
                                                style={styles.canvas}
                                            />
                                            {isConnected && (
                                                <Loader size="xs" color="blue" style={styles.loaderOverlay} />
                                            )}
                                        </Box>
                                    </Group>
                                </Box>

                                <Group gap="xs" align="flex-start">
                                    <Box visibleFrom="sm">
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            size="lg"
                                        >
                                            <IconPaperclip size={20} />
                                        </ActionIcon>
                                    </Box>

                                    <TextInput
                                        ref={inputRef}
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.currentTarget.value)}
                                        onKeyDown={handleKeyPress}
                                        style={{ flex: 1 }}
                                        radius="xl"
                                        rightSection={
                                            <Group gap="xs">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color={isRecording ? "red" : "blue"}
                                                    onClick={handleRecordingClick}
                                                    size="lg"
                                                    disabled={isConnecting || isInitializing}
                                                >
                                                    {getIcon()}
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="lg"
                                                    disabled={!message.trim() || isSending || isConnecting || isInitializing}
                                                    onClick={handleSendMessage}
                                                >
                                                    {isSending ? <Loader size="xs" color="white" /> : <IconArrowUp size={20} />}
                                                </ActionIcon>
                                            </Group>
                                        }
                                        rightSectionWidth={100}
                                    />
                                </Group>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default ChatSection;