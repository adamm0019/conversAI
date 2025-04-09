import React, {useRef, useEffect, useState, useCallback, useMemo} from 'react';
import {
    Stack,
    Group,
    Text,
    Transition,
    Box,
    Loader,
    Center,
    TextInput,
    ActionIcon,
    Button,
    Paper,
    Tooltip
} from '@mantine/core';
import {
    IconMicrophone,
    IconPlayerStop,
    IconPaperclip,
    IconArrowUp,
    IconPlugConnected,
    IconMessageCircle,
    IconVolume,
    IconVolume3,
    IconWifiOff,
    IconAlertCircle,
    IconRefresh
} from '@tabler/icons-react';
import {motion} from 'framer-motion';
import {notifications} from '@mantine/notifications';
import {useUser} from "@clerk/clerk-react";

import {EnhancedConversationItem} from '../../types/conversation';
import {ThinkingAnimation} from '../ThinkingAnimation';
import {MessageBubble} from './MessageBubble';
import {styles, slideIn} from './styles';
import {ChatShelf} from './ChatShelf';
import {ConnectionState} from '../../types/connection';
import {useFirebaseChat} from '../../lib/firebase/firebaseConfig';

interface EnhancedChatSectionProps {
    connectionState: ConnectionState;
    isThinking: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    audioLevel?: number;
    serverAudioLevel?: number;
    connectionError?: string | null;
    onStartRecording: () => Promise<void>;
    onStopRecording: () => Promise<void>;
    onDisconnect: () => Promise<void>;
    onConnect: () => Promise<void>;
    onSendMessage: (message: string, callback?: (response: string) => void) => Promise<void>;
    onNewChat?: () => void;
    clientCanvasRef: React.RefObject<HTMLCanvasElement>;
    serverCanvasRef: React.RefObject<HTMLCanvasElement>;
    messages: EnhancedConversationItem[];
    conversationId?: string | null;
}

// Create the component outside of the render function to avoid re-creation
const ConnectionStatusComponent = React.memo(({
                                                  connectionState,
                                                  error,
                                                  onConnect
                                              }: {
    connectionState: ConnectionState;
    error: string | null;
    onConnect: () => Promise<void>;
}) => {
    // Memoize the button content to prevent unnecessary re-renders
    const buttonContent = useMemo(() => {
        switch (connectionState) {
            case ConnectionState.CONNECTED:
                return {
                    label: "Connected",
                    icon: <IconPlugConnected size={14}/>,
                    color: "green"
                };
            case ConnectionState.CONNECTING:
                return {
                    label: "Connecting...",
                    icon: <Loader size="xs"/>,
                    color: "blue"
                };
            case ConnectionState.RECONNECTING:
                return {
                    label: "Reconnecting...",
                    icon: <IconRefresh size={14}/>,
                    color: "yellow"
                };
            case ConnectionState.ERROR:
                return {
                    label: "Connection Error",
                    icon: <IconAlertCircle size={14}/>,
                    color: "red"
                };
            default:
                return {
                    label: "Disconnected",
                    icon: <IconWifiOff size={14}/>,
                    color: "gray"
                };
        }
    }, [connectionState]);

    const tooltipLabel = useMemo(() => {
        if (connectionState === ConnectionState.ERROR && error) {
            return error;
        }

        switch (connectionState) {
            case ConnectionState.CONNECTED:
                return "Connected to language service";
            case ConnectionState.CONNECTING:
                return "Connecting...";
            case ConnectionState.RECONNECTING:
                return "Attempting to reconnect";
            case ConnectionState.ERROR:
                return "Connection error";
            default:
                return "Not connected";
        }
    }, [connectionState, error]);

    return (
        <Tooltip label={tooltipLabel}>
            <Button
                size="xs"
                variant="subtle"
                color={buttonContent.color}
                leftSection={buttonContent.icon}
                onClick={connectionState !== ConnectionState.CONNECTED ? onConnect : undefined}
            >
                {buttonContent.label}
            </Button>
        </Tooltip>
    );
});

export const EnhancedChatSection: React.FC<EnhancedChatSectionProps> = ({
                                                                            connectionState,
                                                                            isThinking,
                                                                            isRecording,
                                                                            isSpeaking,
                                                                            audioLevel = 0,
                                                                            serverAudioLevel = 0,
                                                                            connectionError = null,
                                                                            onStartRecording,
                                                                            onStopRecording,
                                                                            onDisconnect,
                                                                            onConnect,
                                                                            onSendMessage,
                                                                            onNewChat,
                                                                            clientCanvasRef,
                                                                            serverCanvasRef,
                                                                            messages
                                                                        }) => {
    const [mounted, setMounted] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<EnhancedConversationItem[]>([]);
    const [chatListOpen, setChatListOpen] = useState(false);

    // Store previous messages for comparison to avoid infinite updates
    const prevMessagesRef = useRef<EnhancedConversationItem[]>([]);

    const {user} = useUser();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        createNewChat,
        addMessageToChat,
        markChatAsRead,
        subscribeToChats
    } = useFirebaseChat();

    // Check if the connection is ready for interaction
    const isConnected = connectionState === ConnectionState.CONNECTED;

    // Check if connection is in a transitional state
    const isConnectionTransitioning = useMemo(() =>
            connectionState === ConnectionState.CONNECTING ||
            connectionState === ConnectionState.RECONNECTING,
        [connectionState]);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: "smooth"});
        }
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [currentMessages, scrollToBottom]);

    // Set mounted state on component mount
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Subscribe to chat updates
    useEffect(() => {
        if (!activeChat) return () => {
        };

        const unsubscribe = subscribeToChats((chats) => {
            const currentChat = chats.find(chat => chat.id === activeChat);
            if (currentChat && currentChat.messages) {
                // Only update if messages have changed to avoid infinite loop
                if (JSON.stringify(currentChat.messages) !== JSON.stringify(prevMessagesRef.current)) {
                    setCurrentMessages(currentChat.messages);
                    prevMessagesRef.current = currentChat.messages;
                }
            }
        });

        return () => unsubscribe();
    }, [activeChat, subscribeToChats]);

    // Sync messages from props to state when no active chat
    useEffect(() => {
        if (!activeChat && messages && messages.length > 0) {
            // Only update if messages have changed to avoid infinite loop
            if (JSON.stringify(messages) !== JSON.stringify(prevMessagesRef.current)) {
                setCurrentMessages(messages);
                prevMessagesRef.current = messages;
            }
        }
    }, [messages, activeChat]);

    const handleStartChat = useCallback(async () => {
        try {
            setIsConnecting(true);
            await navigator.mediaDevices.getUserMedia({audio: true});

            const newChatId = await createNewChat();
            setActiveChat(newChatId);
            setCurrentMessages([]);
            prevMessagesRef.current = [];

            if (connectionState !== ConnectionState.CONNECTED) {
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
    }, [connectionState, createNewChat, onConnect]);

    const handleSendMessage = useCallback(async () => {
        if (!message.trim() || isSending) return;

        try {
            setIsSending(true);

            if (connectionState !== ConnectionState.CONNECTED) {
                await onConnect();
            }

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

            const currentMsg = message;
            setMessage(''); // Clear input field immediately for better UX

            if (!activeChat) {
                const chatId = await createNewChat(newMessage);
                setActiveChat(chatId);
            } else {
                await addMessageToChat(activeChat, newMessage);
            }

            // Define a response callback function
            const responseCallback = async (response: string) => {
                console.log("Received response callback:", response.substring(0, 30) + "...");
                if (activeChat) {
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
                    await addMessageToChat(activeChat, aiMessage);
                }
            };

            // Send message to websocket with the response callback
            await onSendMessage(currentMsg, responseCallback);

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
        }
    }, [message, isSending, connectionState, onConnect, activeChat, createNewChat, addMessageToChat, onSendMessage]);

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const handleRecordingClick = useCallback(async () => {
        try {
            if (connectionState !== ConnectionState.CONNECTED) {
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
    }, [connectionState, isRecording, onConnect, onStartRecording, onStopRecording]);

    const handleChatSelect = useCallback(async (chatId: string) => {
        setActiveChat(chatId);
        await markChatAsRead(chatId);
    }, [markChatAsRead]);

    const handleChatClose = useCallback((chatId: string) => {
        if (activeChat === chatId) {
            setActiveChat(null);
            setCurrentMessages([]);
            prevMessagesRef.current = [];
        }
    }, [activeChat]);

    // Memoize the icon to prevent unnecessary re-renders
    const actionIcon = useMemo(() => {
        if (isConnecting || connectionState === ConnectionState.CONNECTING) {
            return <Loader size="xs"/>;
        }
        if (isRecording) {
            return <IconPlayerStop size={20}/>;
        }
        if (connectionState !== ConnectionState.CONNECTED) {
            return <IconPlugConnected size={20}/>;
        }
        return <IconMicrophone size={20}/>;
    }, [isConnecting, connectionState, isRecording]);

    // Memoize messages rendering to prevent re-renders
    const renderedMessages = useMemo(() => {
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
                    <Box style={{animation: `${slideIn} 0.3s ease-out`, width: '100%'}}>
                        <Box style={styles.messageGroup}>
                            <MessageBubble item={item}/>
                            {index === currentMessages.length - 1 && isThinking && item.role === 'user' && (
                                <Box mt="md" ml="md">
                                    <ThinkingAnimation/>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </React.Fragment>
            );
        });
    }, [currentMessages, isThinking]);

    const emptyState = useMemo(() => (
        <Center style={{height: 'calc(100vh - 200px)'}}>
            <Stack align="center" m="md">
                <Text size="xl" fw={600} c="dimmed">Hi {user?.firstName || 'there'}! 👋</Text>
                {connectionState === ConnectionState.CONNECTING ? (
                    <Stack align="center" m="md">
                        <Loader size="sm"/>
                        <Text size="sm" c="dimmed">Connecting to language service...</Text>
                    </Stack>
                ) : connectionError ? (
                    <Stack align="center" m="md">
                        <Text size="sm" c="red">Connection failed: {connectionError}</Text>
                        <Button
                            leftSection={<IconMessageCircle size={20}/>}
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
                            Ready to practice! You can type a message or click the microphone to speak.
                        </Text>
                        <Button
                            leftSection={<IconMessageCircle size={20}/>}
                            variant="light"
                            color="blue"
                            onClick={handleStartChat}
                            loading={isConnecting}
                        >
                            Start new conversation
                        </Button>
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed" ta="center" maw={600}>
                        Ready to practice! Type a message or click the microphone to speak.
                    </Text>
                )}
            </Stack>
        </Center>
    ), [connectionState, connectionError, isConnected, isConnecting, handleStartChat, user?.firstName]);

    // Memoize status indicators
    const statusIndicators = useMemo(() => (
        <Group gap="xs">
            {isSpeaking && (
                <Group gap="xs">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <IconVolume3 size={16} color="#64b5f6"/>
                    </motion.div>
                    <Text size="xs" c="dimmed">Speaking</Text>
                </Group>
            )}

            {isRecording && (
                <Group gap="xs">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{color: '#f44336'}}
                    >
                        <IconMicrophone size={16}/>
                    </motion.div>
                    <Text size="xs" c="dimmed">Recording</Text>
                </Group>
            )}

            {isThinking && !isSpeaking && !isRecording && (
                <Group gap="xs">
                    <Loader size="xs" color="blue"/>
                    <Text size="xs" c="dimmed">Processing</Text>
                </Group>
            )}
        </Group>
    ), [isSpeaking, isRecording, isThinking]);

    return (
        <Box style={styles.container}>
            <ChatShelf
                activeChat={activeChat || ''}
                onSelectChat={handleChatSelect}
                onCloseChat={handleChatClose}
                onNewChat={handleStartChat}
            />

            <Box style={{
                ...styles.chatArea,
                marginLeft: chatListOpen ? '320px' : '28px',
                transition: 'margin-left 0.3s ease'
            }}>
                <Paper
                    p="xs"
                    radius="md"
                    style={{
                        backgroundColor: 'rgba(37, 38, 43, 0.7)',
                        backdropFilter: 'blur(10px)',
                        marginBottom: '1rem',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}
                >
                    <Group justify="space-between">
                        <ConnectionStatusComponent
                            connectionState={connectionState}
                            error={connectionError}
                            onConnect={onConnect}
                        />
                        {statusIndicators}
                    </Group>
                </Paper>

                <Box style={styles.messageContainer}>
                    {currentMessages.length === 0 ? (
                        emptyState
                    ) : (
                        <Stack m="xl">
                            {renderedMessages}
                            <div ref={messagesEndRef}/>
                        </Stack>
                    )}
                </Box>
            </Box>

            {isConnected && (
                <Box style={styles.inputContainer}>
                    <Box style={styles.inputWrapper}>
                        <Box style={styles.inputInner}>
                            <Stack m="sm">
                                <Box visibleFrom="sm" style={{
                                    ...styles.visualizersDesktop,
                                    opacity: isRecording || isSpeaking ? 1 : 0.5,
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    <Group gap="xl">
                                        <Box style={{position: 'relative'}}>
                                            <Text size="xs" c="dimmed" mb={4}>You</Text>
                                            <Paper
                                                p={0}
                                                radius="md"
                                                style={{
                                                    width: 120,
                                                    height: 40,
                                                    overflow: 'hidden',
                                                    backgroundColor: 'var(--mantine-color-dark-7)',
                                                    border: '1px solid var(--mantine-color-dark-5)',
                                                    position: 'relative'
                                                }}
                                            >
                                                <canvas
                                                    ref={clientCanvasRef}
                                                    height={40}
                                                    width={120}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%'
                                                    }}
                                                />

                                                {isRecording && (
                                                    <motion.div
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '4px',
                                                            right: '4px',
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#f44336'
                                                        }}
                                                        animate={{
                                                            opacity: [0.7, 1, 0.7]
                                                        }}
                                                        transition={{
                                                            duration: 1,
                                                            repeat: Infinity
                                                        }}
                                                    />
                                                )}
                                            </Paper>
                                        </Box>

                                        <Box style={{position: 'relative'}}>
                                            <Text size="xs" c="dimmed" mb={4}>AI</Text>
                                            <Paper
                                                p={0}
                                                radius="md"
                                                style={{
                                                    width: 120,
                                                    height: 40,
                                                    overflow: 'hidden',
                                                    backgroundColor: 'var(--mantine-color-dark-7)',
                                                    border: '1px solid var(--mantine-color-dark-5)',
                                                    position: 'relative'
                                                }}
                                            >
                                                <canvas
                                                    ref={serverCanvasRef}
                                                    height={40}
                                                    width={120}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%'
                                                    }}
                                                />

                                                {isSpeaking && (
                                                    <motion.div
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '4px',
                                                            right: '4px',
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#2196f3'
                                                        }}
                                                        animate={{
                                                            opacity: [0.7, 1, 0.7]
                                                        }}
                                                        transition={{
                                                            duration: 1,
                                                            repeat: Infinity
                                                        }}
                                                    />
                                                )}
                                            </Paper>
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
                                            <IconPaperclip size={20}/>
                                        </ActionIcon>
                                    </Box>

                                    <TextInput
                                        ref={inputRef}
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.currentTarget.value)}
                                        onKeyDown={handleKeyPress}
                                        style={{flex: 1}}
                                        radius="xl"
                                        rightSection={
                                            <Group gap="xs">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color={isRecording ? "red" : "blue"}
                                                    onClick={handleRecordingClick}
                                                    size="lg"
                                                    disabled={isConnectionTransitioning}
                                                >
                                                    {actionIcon}
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="lg"
                                                    disabled={
                                                        !message.trim() ||
                                                        isSending ||
                                                        isConnectionTransitioning
                                                    }
                                                    onClick={handleSendMessage}
                                                >
                                                    {isSending ? <Loader size="xs" color="white"/> :
                                                        <IconArrowUp size={20}/>}
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

export default EnhancedChatSection;