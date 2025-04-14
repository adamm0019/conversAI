import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box, Group, Text, Stack, TextInput,
    ActionIcon, Loader, Center
} from '@mantine/core';
import {
    IconMicrophone, IconPlayerStop, IconArrowUp,
    IconVolume3
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';

import { EnhancedConversationItem } from '../../types/conversation';
import { ThinkingAnimation } from '../ThinkingAnimation';
import MessageBubble from './MessageBubble';
import { styles } from './styles';
import { ChatShelf } from './ChatShelf';
import { ConnectionState } from '../../types/connection';

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

const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

const GreetingMessage = React.memo(({ name }: { name: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
    >
        <Text size="xl" fw={600} c="gray.3">
            🌅 Good {getTimeOfDay()}, {name}
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={500}>
            How can I help you today?
        </Text>
    </motion.div>
));

const EnhancedChatSection: React.FC<EnhancedChatSectionProps> = ({
                                                                     connectionState,
                                                                     isThinking,
                                                                     isRecording,
                                                                     isSpeaking,
                                                                     onStartRecording,
                                                                     onStopRecording,
                                                                     onConnect,
                                                                     onSendMessage,
                                                                     connectionError,
                                                                     messages,
                                                                     clientCanvasRef,
                                                                     serverCanvasRef
                                                                 }) => {
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim()) return;
        try {
            setIsSending(true);
            await onSendMessage(message.trim());
            setMessage('');
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'Could not send message',
                color: 'red'
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const micIcon = isRecording ? <IconPlayerStop size={20} /> : <IconMicrophone size={20} />;

    const shouldShowGreeting = messages.length === 0;

    return (
        <Box style={styles.container}>
            <ChatShelf
                activeChat={''}
                onSelectChat={() => {}}
                onCloseChat={() => {}}
                onNewChat={() => {}}
            />

            <Box style={styles.chatArea}>
                <Box style={styles.messageContainer}>
                    {shouldShowGreeting ? (
                        <Center style={styles.emptyStateContainer}>
                            <GreetingMessage name={user?.firstName || 'friend'} />
                        </Center>
                    ) : (
                        messages.map((item, idx) => (
                            <Box key={idx}>
                                <MessageBubble item={item} />
                                {idx === messages.length - 1 && isThinking && item.role === 'user' && (
                                    <Box mt="md" ml="md"><ThinkingAnimation /></Box>
                                )}
                            </Box>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </Box>
            </Box>

            <Box style={styles.inputContainer}>
                <Box style={styles.inputInner}>
                    <Stack m="sm">
                        <Group gap="xs">
                            <TextInput
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.currentTarget.value)}
                                onKeyDown={handleKeyDown}
                                ref={inputRef}
                                radius="xl"
                                style={{ flex: 1 }}
                                rightSectionWidth={90}
                                rightSection={
                                    <Group gap="xs">
                                        <ActionIcon
                                            variant="subtle"
                                            color="blue"
                                            size="lg"
                                            onClick={isRecording ? onStopRecording : onStartRecording}
                                        >
                                            {micIcon}
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="filled"
                                            color="blue"
                                            size="lg"
                                            onClick={handleSend}
                                            disabled={!message.trim() || isSending}
                                        >
                                            {isSending ? <Loader size="xs" /> : <IconArrowUp size={20} />}
                                        </ActionIcon>
                                    </Group>
                                }
                            />
                        </Group>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default EnhancedChatSection;
