import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box, Group, Text, Stack, TextInput,
    ActionIcon, Loader, Center, Tooltip
} from '@mantine/core';
import {
    IconMicrophone, IconPlayerStop, IconArrowUp,
    IconVolume3, IconSend
} from '@tabler/icons-react';
import {AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { notifications } from '@mantine/notifications';

import { EnhancedConversationItem } from '../../types/conversation';
import { ThinkingAnimation } from '../ThinkingAnimation';
import MessageBubble from './MessageBubble';
import { styles } from './styles';
import { ChatShelf } from './ChatShelf';
import { ConnectionState } from '../../types/connection';
import EmptyState from "../EmptyState/EmptyState.tsx";

interface EnhancedChatSectionProps {
    connectionState: ConnectionState;
    isThinking: boolean;
    isRecording: boolean;
    isSpeaking: boolean; // Added for potential visual feedback
    audioLevel?: number;
    serverAudioLevel?: number;
    connectionError?: string | null;
    onStartRecording: () => Promise<void>;
    onStopRecording: () => Promise<void>;
    onDisconnect: () => Promise<void>;
    onConnect: () => Promise<void>;
    onSendMessage: (message: string, callback?: (response: string) => void) => Promise<void>;
    onNewChat?: () => void; // Keep this if needed by ChatShelf or parent
    clientCanvasRef?: React.RefObject<HTMLCanvasElement>; // Keep if used for visualizers elsewhere
    serverCanvasRef?: React.RefObject<HTMLCanvasElement>; // Keep if used for visualizers elsewhere
    messages: EnhancedConversationItem[];
    conversationId?: string | null; // Needed for ChatShelf active state
    onSelectChat: (id: string) => void; // Needed for ChatShelf
    onCloseChat: (id: string) => void; // Needed for ChatShelf
}

const EnhancedChatSection: React.FC<EnhancedChatSectionProps> = ({
                                                                     connectionState,
                                                                     isThinking,
                                                                     isRecording,
                                                                     isSpeaking,
                                                                     onStartRecording,
                                                                     onStopRecording,
                                                                     onConnect, // Assuming connect/disconnect logic is handled elsewhere (e.g., based on state)
                                                                     onDisconnect,
                                                                     onSendMessage,
                                                                     connectionError,
                                                                     messages,
                                                                     conversationId, // Pass down
                                                                     onNewChat,       // Pass down
                                                                     onSelectChat,    // Pass down
                                                                     onCloseChat,     // Pass down
                                                                     // clientCanvasRef, // Refs are not directly used here anymore unless visualizers are integrated differently
                                                                     // serverCanvasRef,
                                                                 }) => {
    const { user } = useUser();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Smooth scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on load (optional)
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = useCallback(async () => {
        if (!message.trim() || isSending) return;
        const textToSend = message.trim();
        setMessage(''); // Clear input immediately for better UX
        setIsSending(true);
        try {
            await onSendMessage(textToSend);
        } catch (err: any) {
            console.error("Send Error:", err);
            notifications.show({
                title: 'Message Error',
                message: `Failed to send message: ${err.message || 'Unknown error'}`,
                color: 'red',
                autoClose: 4000,
            });
            setMessage(textToSend); // Restore message on error
        } finally {
            setIsSending(false);
            // Refocus input after sending
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [message, isSending, onSendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleMicClick = useCallback(() => {
        if (isRecording) {
            onStopRecording();
        } else {
            onStartRecording();
        }
    }, [isRecording, onStartRecording, onStopRecording]);

    // Determine Mic Icon and Tooltip
    const MicIcon = isRecording ? IconPlayerStop : IconMicrophone;
    const micTooltip = isRecording ? 'Stop recording' : 'Start recording';

    const shouldShowEmptyState = messages.length === 0 && !isThinking; // Show empty only if no messages and not initially thinking

    // --- Framer Motion Variants ---
    const messageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({ // Custom prop for stagger index
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.08, // Stagger appearance
                duration: 0.4,
                ease: "easeOut"
            }
        }),
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const inputContainerVariants = {
        initial: { y: 50, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    const sendButtonVariants = {
        tap: { scale: 0.9 },
        hover: { scale: 1.1 }
    }

    const micButtonVariants = {
        tap: { scale: 0.9 },
        hover: { scale: 1.1 },
        recording: { // Custom state for recording
            scale: [1, 1.15, 1], // Pulse effect
            transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }
    }

    return (
        <Box style={styles.container}>
            {/* Chat Shelf integration */}
            <ChatShelf
                activeChat={conversationId || ''}
                onSelectChat={onSelectChat}
                onCloseChat={onCloseChat} // Pass archive/delete handler if needed
                onNewChat={onNewChat || (() => { console.warn("onNewChat not provided"); })}
            />

            {/* Main Chat Area */}
            <Box style={styles.chatArea} key={conversationId}> {/* Key forces remount on chat change if needed */}
                <AnimatePresence mode="popLayout"> {/* Animate messages in/out */}
                    <Box style={styles.messageContainer}>
                        {shouldShowEmptyState ? (
                            <EmptyState userName={user?.firstName} />
                        ) : (
                            messages.map((item, idx) => (
                                <motion.div
                                    key={item.timestamp?.toString() + idx} // More robust key
                                    custom={idx} // Pass index for stagger
                                    variants={messageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    layout // Enable smooth layout changes
                                    style={item.role === 'user' ? styles.messageBubbleWrapperUser : styles.messageBubbleWrapper}
                                >
                                    <MessageBubble item={item} />
                                    {/* Timestamp can be inside MessageBubble or here */}
                                    {/* <Text size="xs" c="dimmed" mt={2} style={{alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', opacity: 0.6 }}>
                                        {formatTimestamp(item.timestamp)} // Add a formatTimestamp function
                                     </Text> */}
                                </motion.div>
                            ))
                        )}

                        {/* Thinking Indicator */}
                        {isThinking && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ ...styles.messageBubbleWrapper, ...styles.thinkingAnimationContainer }}
                                layout
                            >
                                <ThinkingAnimation />
                            </motion.div>
                        )}

                        {/* Element to scroll to */}
                        <div ref={messagesEndRef} style={{ height: '1px' }} />
                    </Box>
                </AnimatePresence>
            </Box>

            {/* Fixed Input Bar Area */}
            <motion.div
                style={styles.inputContainer}
                variants={inputContainerVariants}
                initial="initial"
                animate="animate"
            >
                <Box style={styles.inputInner}>
                    {/* Optional: Connection Status/Error Display */}
                    {connectionError && (
                        <Text c="red.6" size="xs" ta="center" mb="xs">Error: {connectionError}</Text>
                    )}
                    {connectionState === 'connecting' && (
                        <Group justify="center" mb="xs"><Loader size="xs" /><Text size="xs" c="dimmed">Connecting...</Text></Group>
                    )}

                    <Group wrap="nowrap" align="flex-end">
                        <TextInput
                            placeholder="Type or speak your message..."
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            ref={inputRef}
                            radius="xl"
                            size="md" // Slightly larger input
                            multiline // Allow multiline input easily
                            minRows={1}
                            maxRows={5}
                            autosize // Automatically adjusts height
                            style={{ flex: 1 }}
                            styles={{ // Apply styles directly to Mantine components
                                input: styles.textInputInput,
                                // root: styles.textInputRoot // If you added root styles
                            }}
                            rightSectionWidth={85} // Adjust width for potentially larger icons or spacing
                            disabled={isSending || isRecording} // Disable text input while sending/recording
                        />
                        {/* Action Icons */}
                        <Group gap="xs" wrap="nowrap" style={styles.inputActions}>
                            <Tooltip label={micTooltip} position="top" withArrow>
                                <motion.div
                                    variants={micButtonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    animate={isRecording ? "recording" : ""}
                                >
                                    <ActionIcon
                                        variant={isRecording ? "filled" : "subtle"}
                                        color={isRecording ? "red" : "blue"}
                                        size="xl" // Larger click target
                                        radius="xl"
                                        onClick={handleMicClick}
                                        disabled={isSending} // Disable mic while sending text
                                        loading={false} // Handle loading state if needed for mic init
                                        aria-label={micTooltip}
                                    >
                                        <MicIcon size={22} />
                                    </ActionIcon>
                                </motion.div>
                            </Tooltip>
                            <Tooltip label={isSending ? "Sending..." : "Send message"} position="top" withArrow>
                                <motion.div
                                    variants={sendButtonVariants}
                                    whileHover={!isSending && message.trim() ? "hover" : ""} // Only hover effect if enabled
                                    whileTap={!isSending && message.trim() ? "tap" : ""}   // Only tap effect if enabled
                                >
                                    <ActionIcon
                                        variant="filled"
                                        color="blue"
                                        size="xl" // Larger click target
                                        radius="xl"
                                        onClick={handleSend}
                                        disabled={!message.trim() || isSending || isRecording} // Disable send if no text, sending, or recording
                                        loading={isSending}
                                        aria-label="Send message"
                                    >
                                        {/* Don't show loader inside, use `loading` prop */}
                                        <IconSend size={20} stroke={1.5} />
                                    </ActionIcon>
                                </motion.div>
                            </Tooltip>
                        </Group>
                    </Group>
                </Box>
            </motion.div>
        </Box>
    );
};

export default EnhancedChatSection;