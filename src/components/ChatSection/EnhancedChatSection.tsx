import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Box, Group, Text, Stack, TextInput,
    ActionIcon, Loader, Center, Tooltip
} from '@mantine/core';
import {
    IconMicrophone, IconPlayerStop, IconSend
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';

import { EnhancedConversationItem } from '../../types/conversation';
import { ThinkingAnimation } from '../ThinkingAnimation';
import MessageBubble from './MessageBubble';
import { styles } from './styles';
import { ChatShelf } from './ChatShelf';
import { ConnectionState } from '../../types/connection';
import EmptyState from "../EmptyState/EmptyState";
import VoiceActivityIndicator from './VoiceActivityIndicator';

interface EnhancedChatSectionProps {
    connectionState: ConnectionState;
    isThinking: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    audioLevel?: number;
    connectionError?: string | null;
    onStartRecording: () => Promise<void>;
    onStopRecording: () => Promise<void>;
    onDisconnect: () => Promise<void>;
    onConnect: () => Promise<void>;
    onSendMessage: (message: string, callback?: (response: string) => void) => Promise<void>;
    onNewChat?: () => void;
    messages: EnhancedConversationItem[];
    conversationId?: string | null;
    onSelectChat: (id: string) => void;
    onCloseChat: (id: string) => void;
}

const EnhancedChatSection: React.FC<EnhancedChatSectionProps> = ({
    connectionState,
    isThinking,
    isRecording,
    isSpeaking,
    audioLevel = 0,
    connectionError,
    onStartRecording,
    onStopRecording,
    onConnect,
    onDisconnect,
    onSendMessage,
    messages,
    conversationId,
    onNewChat,
    onSelectChat,
    onCloseChat,
}) => {
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);


    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(focusTimeout);
    }, [conversationId]);


    const handleSend = useCallback(async () => {
        if (!message.trim() || isSending || isRecording) return;
        const textToSend = message.trim();
        setMessage('');
        setIsSending(true);
        try {
            await onSendMessage(textToSend);
        } catch (err: any) {
            console.error("Send Error:", err);
            notifications.show({ title: 'Message Error', message: `Failed to send message: ${err.message || 'Unknown error'}`, color: 'red', autoClose: 4000 });
            setMessage(textToSend);
        } finally {
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [message, isSending, isRecording, onSendMessage]);


    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend, isRecording]);


    const handleMicClick = useCallback(() => {
        if (isRecording) {
            onStopRecording();
        } else {
            if (!isSending) {
                setMessage('');
                onStartRecording();
                inputRef.current?.focus();
            }
        }
    }, [isRecording, isSending, onStartRecording, onStopRecording]);


    const micTooltip = isRecording ? 'Stop recording' : 'Start recording';


    const shouldShowEmptyState = messages.length === 0 && !isThinking && connectionState !== ConnectionState.CONNECTING;


    const messageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" } }),
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };
    const inputContainerVariants = {
        initial: { y: 30, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    };
    const sendButtonVariants = {
        tap: { scale: 0.9 },
        hover: { scale: 1.1 }
    };

    const micContainerVariants = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 15, duration: 0.2 } },
        exit: { scale: 0.5, opacity: 0, transition: { duration: 0.15 } },
        hover: { scale: 1.1 },
        tap: { scale: 0.9 }
    };

    return (

        <div style={styles.container}>
            <ChatShelf
                activeChat={conversationId || ''}
                onSelectChat={onSelectChat}
                onCloseChat={onCloseChat}
                onNewChat={onNewChat || (() => { console.warn("onNewChat not provided"); })}
            />
            <Box style={styles.chatArea} key={conversationId}>
                <AnimatePresence mode="popLayout">
                    <Box style={styles.messageContainer}>
                        {shouldShowEmptyState && <EmptyState userName={user?.firstName} />}

                        {!shouldShowEmptyState && messages.map((item, idx) => (
                            <motion.div
                                key={item.timestamp?.toString() + idx + item.role}
                                custom={idx}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout="position"
                                style={item.role === 'user' ? styles.messageBubbleWrapperUser : styles.messageBubbleWrapper}
                            >
                                <MessageBubble item={item} />
                            </motion.div>
                        ))}
                        {isThinking && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ ...styles.messageBubbleWrapper, ...styles.thinkingAnimationContainer }}
                                layout="position"
                            >
                                <ThinkingAnimation />
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} style={{ height: '1px' }} />
                    </Box>
                </AnimatePresence>
            </Box>

            <motion.div
                style={styles.inputContainer}
                variants={inputContainerVariants}
                initial="initial"
                animate="animate"
            >
                <Box mb="xs" style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center', height: '16px' }}>
                    {connectionError && <Text c="red.6" size="xs">Error: {connectionError}</Text>}
                    {connectionState === ConnectionState.CONNECTING && !connectionError && (
                        <Group justify="center" gap={4}><Loader size="xs" type="dots" /><Text size="xs" c="dimmed">Connecting...</Text></Group>
                    )}
                </Box>

                <Box style={styles.inputInner}>
                    <TextInput
                        placeholder={isRecording ? "Recording..." : "Type or speak your message..."}
                        value={message}
                        onChange={(e) => setMessage(e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        size="md"
                        style={{ flex: 1, alignSelf: 'stretch' }}
                        styles={{ input: styles.textInputInput, wrapper: { padding: 0 } }}
                        disabled={isSending || connectionState === ConnectionState.CONNECTING}
                        readOnly={isRecording}
                        variant="unstyled"
                    />


                    <Group gap="xs" wrap="nowrap" style={styles.inputActions}>

                        <AnimatePresence mode="wait">
                            {isRecording ? (

                                <motion.div
                                    key="voice-indicator"
                                    variants={micContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    <VoiceActivityIndicator
                                        audioLevel={audioLevel}
                                        onClick={handleMicClick}
                                        tooltipLabel={micTooltip}
                                        color="red"
                                        size={38}
                                    />
                                </motion.div>
                            ) : (

                                <motion.div
                                    key="mic-icon"
                                    variants={micContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    whileHover={!isSending && connectionState === ConnectionState.CONNECTED ? "hover" : ""}
                                    whileTap={!isSending && connectionState === ConnectionState.CONNECTED ? "tap" : ""}
                                >
                                    <Tooltip label={micTooltip} position="top" withArrow>
                                        <ActionIcon
                                            variant="subtle"
                                            color={message.trim() ? 'blue' : 'gray'}
                                            size="lg"
                                            radius="xl"
                                            onClick={handleMicClick}
                                            disabled={isSending || connectionState !== ConnectionState.CONNECTED}
                                            aria-label={micTooltip}
                                        >
                                            <IconMicrophone size={20} stroke={1.5} />
                                        </ActionIcon>
                                    </Tooltip>
                                </motion.div>
                            )}
                        </AnimatePresence>


                        <AnimatePresence>
                            {!isRecording && message.trim() && (
                                <motion.div
                                    key="send-button"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    variants={sendButtonVariants}
                                    whileHover={!isSending ? "hover" : ""}
                                    whileTap={!isSending ? "tap" : ""}
                                >
                                    <Tooltip label={isSending ? "Sending..." : "Send message"} position="top" withArrow>
                                        <ActionIcon
                                            variant="filled"
                                            color="blue"
                                            size="lg"
                                            radius="xl"
                                            onClick={handleSend}
                                            disabled={isSending}
                                            loading={isSending}
                                            aria-label="Send message"
                                        >
                                            <IconSend size={20} stroke={1.5} />
                                        </ActionIcon>
                                    </Tooltip>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Group>
                </Box>
            </motion.div>
        </div>
    )
};

export default EnhancedChatSection;