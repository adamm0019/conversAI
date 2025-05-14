import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    Box, Group, Text, Stack, TextInput,
    ActionIcon, Loader, Center, Tooltip
} from '@mantine/core';
import {
    IconMicrophone, IconPlayerStop, IconSend
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';

import { ConversationItem } from '../../types/conversation';
import { ThinkingAnimation } from '../ThinkingAnimation';
import MessageBubble from './MessageBubble';
import { ChatShelf } from './ChatShelf';
import { ConnectionState } from '../../types/connection';
import EmptyState from "../EmptyState/EmptyState";
import VoiceActivityIndicator from './VoiceActivityIndicator';

interface ChatSectionProps {
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
    messages: ConversationItem[];
    conversationId?: string | null;
    onSelectChat: (id: string) => void;
    onCloseChat: (id: string) => void;
}


const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%', 
        width: '100%',
        position: 'relative' as const,
        overflow: 'hidden',
        backgroundColor: '#141417', 
        backgroundImage: 'radial-gradient(circle at top right, rgba(65, 149, 211, 0.08) 0%, transparent 80%)',
        backgroundAttachment: 'fixed',
    },

    chatArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '20px',
        paddingBottom: '150px',
        scrollBehavior: 'smooth' as const,
        backgroundColor: 'transparent',
        '&::-webkit-scrollbar': {
            width: '6px',
            background: 'transparent'
        },
        '&::-webkit-scrollbar-track': {
            background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
            background: 'rgba(65, 149, 211, 0.3)',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(65, 149, 211, 0.5)'
        }
    },

    messageContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },

    messageBubbleWrapper: {
        display: 'flex',
        flexDirection: 'column' as const,
        maxWidth: '75%',
        gap: '4px',
        alignSelf: 'flex-start',
        position: 'relative' as const
    },
    
    messageBubbleWrapperUser: {
        alignSelf: 'flex-end'
    },
    
    messageBubbleBase: {
        padding: '12px 18px',
        borderRadius: '20px',
        wordBreak: 'break-word' as const,
        whiteSpace: 'pre-wrap' as const,
        width: 'fit-content',
        fontSize: '15px',
        lineHeight: '1.6',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    
    messageBubbleAssistant: {
        background: 'linear-gradient(135deg, rgba(30, 31, 40, 0.9), rgba(25, 25, 35, 0.9))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--mantine-color-gray-1)',
        borderTopLeftRadius: '8px',
        alignSelf: 'flex-start',
        border: '1px solid rgba(65, 149, 211, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    },
    
    messageBubbleUser: {
        background: 'linear-gradient(135deg, #4195d3, #3182ce)',
        color: 'white',
        borderTopRightRadius: '8px',
        alignSelf: 'flex-end',
        boxShadow: '0 4px 16px rgba(65, 149, 211, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    },
    
    messageText: {
        fontSize: '15px', 
        lineHeight: '1.6'
    },
    
    messageTimestamp: {
        fontSize: '10px',
        color: 'var(--mantine-color-gray-5)',
        alignSelf: 'flex-end',
        marginTop: '4px',
        opacity: 0.7,
        cursor: 'help'
    },
    
    thinkingAnimationContainer: {
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        padding: '10px 16px', 
        marginLeft: '10px',
    },

    inputContainer: {
        position: 'relative' as const, 
        zIndex: 100, 
        paddingTop: '40px', 
        paddingBottom: '24px',
        paddingLeft: 'var(--mantine-spacing-md)', 
        paddingRight: 'var(--mantine-spacing-md)',
        '&::before': {
            content: '""', 
            position: 'absolute' as const, 
            bottom: 'calc(100% - 40px)', 
            left: 0, 
            right: 0, 
            height: '80px',
            background: 'linear-gradient(to top, rgba(20, 20, 23, 0.9), transparent)',
            pointerEvents: 'none' as const, 
            zIndex: -1,
        },
    },
    
    inputInner: {
        maxWidth: '840px',
        margin: '0 auto',
        position: 'relative' as const,
        padding: '8px 8px 8px 16px',
        background: 'linear-gradient(135deg, rgba(30, 31, 40, 0.9), rgba(25, 25, 35, 0.9))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
    },
    
    textInputInput: {
        backgroundColor: 'transparent', 
        border: 'none', 
        color: 'var(--mantine-color-gray-1)',
        minHeight: '40px', 
        padding: '10px 0', 
        fontSize: '15px', 
        lineHeight: '1.5', 
        flex: 1,
        resize: 'none' as const, 
        boxShadow: 'none !important',
        '&::placeholder': {
            color: 'var(--mantine-color-gray-5)', 
            opacity: 0.8
        },
        scrollbarWidth: 'none', 
        '&::-webkit-scrollbar': {
            display: 'none'
        },
    },
    
    inputActions: {
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        paddingBottom: '4px',
    },

    emptyStateContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center' as const,
        padding: '32px',
        minHeight: 'calc(100vh - 250px)',
        backgroundColor: 'transparent',
        position: 'relative' as const,
        zIndex: 5
    },
    
    emptyStateIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(65, 149, 211, 0.2), rgba(131, 102, 209, 0.2))',
        boxShadow: '0 0 32px rgba(65, 149, 211, 0.3)',
        marginBottom: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
    },
    
    emptyStateGreeting: {
        fontSize: '22px', 
        fontWeight: 600, 
        color: 'var(--mantine-color-gray-1)', 
        marginBottom: '8px'
    },
    
    emptyStatePrompt: {
        fontSize: '15px', 
        color: 'var(--mantine-color-gray-4)', 
        maxWidth: '450px', 
        lineHeight: 1.6
    },
} as const;

const ChatSection: React.FC<ChatSectionProps> = ({
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
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = 0;
        }
    }, [conversationId]);

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

            notifications.show({ 
                title: 'Message Error', 
                message: `Failed to send message: ${err.message || 'Unknown error'}`, 
                color: 'red', 
                autoClose: 4000 
            });
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
        visible: (i: number) => ({ 
            opacity: 1, 
            y: 0, 
            transition: { 
                delay: i * 0.08, 
                duration: 0.4, 
                ease: "easeOut" 
            } 
        }),
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };
    
    const inputContainerVariants = {
        initial: { y: 30, opacity: 0 },
        animate: { 
            y: 0, 
            opacity: 1, 
            transition: { 
                duration: 0.4, 
                ease: 'easeOut' 
            } 
        },
    };
    
    const sendButtonVariants = {
        tap: { scale: 0.9 },
        hover: { scale: 1.1 }
    };

    const micContainerVariants = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
                type: 'spring', 
                stiffness: 300, 
                damping: 15, 
                duration: 0.2 
            } 
        },
        exit: { 
            scale: 0.5, 
            opacity: 0, 
            transition: { 
                duration: 0.15 
            } 
        },
        hover: { scale: 1.1 },
        tap: { scale: 0.9 }
    };

    return (
        <div style={styles.container}>
            <ChatShelf
                activeChat={conversationId || ''}
                onSelectChat={onSelectChat}
                onCloseChat={onCloseChat}
                onNewChat={onNewChat || (() => { console.warn(" "); })}
            >
                <Box style={styles.chatArea} key={conversationId} ref={chatAreaRef}>
                    <AnimatePresence mode="popLayout">
                        <Box style={styles.messageContainer}>
                            {shouldShowEmptyState && (
                                <EmptyState 
                                    userName={user?.displayName || user?.email?.split('@')[0]} 
                                />
                            )}

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
                            <Group justify="center" gap={4}>
                                <Loader size="xs" type="dots" />
                                <Text size="xs" c="dimmed">Connecting...</Text>
                            </Group>
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
            </ChatShelf>
        </div>
    )
};

export default ChatSection;