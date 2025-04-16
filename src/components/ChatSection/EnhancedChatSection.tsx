import React, { useRef, useEffect, useState, useCallback } from 'react';
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

import { EnhancedConversationItem } from '../../types/conversation'; // Verify path
import { ThinkingAnimation } from '../ThinkingAnimation'; // Verify path
import MessageBubble from './MessageBubble'; // Verify path
import { styles } from './styles'; // Verify path
import { ChatShelf } from './ChatShelf'; // Verify path
import { ConnectionState } from '../../types/connection'; // Verify path
import EmptyState from "../EmptyState/EmptyState"; // Verify path
import VoiceActivityIndicator from './VoiceActivityIndicator';
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error; // Verify path

interface EnhancedChatSectionProps {
    connectionState: ConnectionState;
    isThinking: boolean;
    isRecording: boolean;
    isSpeaking: boolean;
    audioLevel?: number; // Receives audio level from parent (Home.tsx)
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
                                                                     audioLevel = 0, // Default audio level to 0 if undefined
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

    // Effect to scroll messages into view
    useEffect(() => {
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    // Effect to focus input
    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(focusTimeout);
    }, [conversationId]); // Refocus if the conversationId changes

    // Handler to send text message
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
            setMessage(textToSend); // Restore on error
        } finally {
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [message, isSending, isRecording, onSendMessage]);

    // Handler for Enter key press
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend, isRecording]);

    // Handler for clicking the mic icon or voice indicator
    const handleMicClick = useCallback(() => {
        if (isRecording) {
            onStopRecording();
        } else {
            if (!isSending) { // Prevent starting recording while sending text
                setMessage(''); // Clear text input
                onStartRecording();
                inputRef.current?.focus(); // Keep focus
            }
        }
    }, [isRecording, isSending, onStartRecording, onStopRecording]);

    // Tooltip text based on recording state
    const micTooltip = isRecording ? 'Stop recording' : 'Start recording';

    // Determine if the empty state should be shown
    const shouldShowEmptyState = messages.length === 0 && !isThinking && connectionState !== ConnectionState.CONNECTING;

    // --- Framer Motion Variants ---
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
    // Variants for the mic icon / activity indicator container (used in AnimatePresence)
    const micContainerVariants = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 15, duration: 0.2 } },
        exit: { scale: 0.5, opacity: 0, transition: { duration: 0.15 } },
        hover: { scale: 1.1 }, // For hover effect on the container
        tap: { scale: 0.9 }   // For tap effect on the container
    };

    return (
        // Main container for the chat section including shelf and input
        <div style={styles.container}>
            <ChatShelf
                activeChat={conversationId || ''}
                onSelectChat={onSelectChat}
                onCloseChat={onCloseChat} // Or specific handler
                onNewChat={onNewChat || (() => { console.warn("onNewChat not provided"); })}
            />

            {/* Scrollable chat message area */}
            <Box style={styles.chatArea} key={conversationId}>
                <AnimatePresence mode="popLayout">
                    <Box style={styles.messageContainer}>
                        {/* Render Empty State or Messages */}
                        {shouldShowEmptyState && <EmptyState userName={user?.firstName} />}

                        {!shouldShowEmptyState && messages.map((item, idx) => (
                            <motion.div
                                key={item.timestamp?.toString() + idx + item.role} // Robust key
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

                        {/* Render Thinking Indicator */}
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

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} style={{ height: '1px' }} />
                    </Box>
                </AnimatePresence>
            </Box>

            {/* Input area at the bottom */}
            <motion.div
                style={styles.inputContainer}
                variants={inputContainerVariants}
                initial="initial"
                animate="animate"
            >
                {/* Optional Connection Status */}
                <Box mb="xs" style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center', height: '16px' /* Reserve space */ }}>
                    {connectionError && <Text c="red.6" size="xs">Error: {connectionError}</Text>}
                    {connectionState === ConnectionState.CONNECTING && !error && (
                        <Group justify="center" gap={4}><Loader size="xs" type="dots" /><Text size="xs" c="dimmed">Connecting...</Text></Group>
                    )}
                </Box>

                {/* Inner container for text input and icons */}
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
                        readOnly={isRecording} // Prevent typing while recording
                        variant="unstyled"
                    />

                    {/* Action Icons Group */}
                    <Group gap="xs" wrap="nowrap" style={styles.inputActions}>
                        {/* Animated switch between Mic Icon and Voice Indicator */}
                        <AnimatePresence mode="wait">
                            {isRecording ? (
                                // Show Voice Activity Indicator when recording
                                <motion.div
                                    key="voice-indicator" // Unique key for AnimatePresence
                                    variants={micContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    <VoiceActivityIndicator
                                        audioLevel={audioLevel} // Pass current audio level
                                        onClick={handleMicClick} // Click to stop recording
                                        tooltipLabel={micTooltip}
                                        color="red" // Indicate recording state
                                        size={38} // Match icon size visually
                                    />
                                </motion.div>
                            ) : (
                                // Show Microphone Icon when not recording
                                <motion.div
                                    key="mic-icon" // Unique key for AnimatePresence
                                    variants={micContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    whileHover={!isSending && connectionState === ConnectionState.CONNECTED ? "hover" : ""} // Allow hover only if connected and not sending
                                    whileTap={!isSending && connectionState === ConnectionState.CONNECTED ? "tap" : ""}
                                >
                                    <Tooltip label={micTooltip} position="top" withArrow>
                                        <ActionIcon
                                            variant="subtle"
                                            color={message.trim() ? 'blue' : 'gray'} // Reflect send button state
                                            size="lg"
                                            radius="xl"
                                            onClick={handleMicClick} // Click to start recording
                                            disabled={isSending || connectionState !== ConnectionState.CONNECTED} // Disable if sending or not connected
                                            aria-label={micTooltip}
                                        >
                                            <IconMicrophone size={20} stroke={1.5}/>
                                        </ActionIcon>
                                    </Tooltip>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Animated Send Button */}
                        <AnimatePresence>
                            {!isRecording && message.trim() && ( // Show only if not recording and message exists
                                <motion.div
                                    key="send-button"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    variants={sendButtonVariants}
                                    whileHover={!isSending ? "hover" : ""} // Allow hover only if not sending
                                    whileTap={!isSending ? "tap" : ""}
                                >
                                    <Tooltip label={isSending ? "Sending..." : "Send message"} position="top" withArrow>
                                        <ActionIcon
                                            variant="filled"
                                            color="blue"
                                            size="lg"
                                            radius="xl"
                                            onClick={handleSend}
                                            disabled={isSending} // Disable only while actively sending
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
    );
};

export default EnhancedChatSection;