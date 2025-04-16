// src/components/ChatSection/MessageBubble.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, ActionIcon, Tooltip, Collapse, Group, Badge } from '@mantine/core';
import { IconCopy, IconCheck, IconVolume, IconPlayerPlay, IconPlayerPause, IconMicrophone } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { styles } from './styles'; // Verify path
import { EnhancedConversationItem, ContentItem } from '../../types/conversation'; // Verify path
import { formatDistanceToNowStrict } from 'date-fns';
import FeedbackMessage from '../FeedbackMessage/FeedbackMessage'; // Verify path

interface MessageBubbleProps {
  item: EnhancedConversationItem;
}

// Framer Motion Variants
const bubbleVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
const copyIconVariants = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 0.6, scale: 1, transition: { duration: 0.2 } },
  hover: { opacity: 1, scale: 1.1 },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.15 } }
};
const feedbackVariants = {
  hidden: { opacity: 0, y: -10, height: 0 }, // Animate from top slightly
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } }
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const isAssistant = item.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);

  const fullText = getDisplayText(item);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(err => console.error("Audio play error:", err));
    } else {
      audio.pause();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlayingAudio(true);
    const handlePause = () => setIsPlayingAudio(false);
    const handleEnded = () => setIsPlayingAudio(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    setIsPlayingAudio(!audio.paused); // Check initial state
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [item.formatted?.file?.url, item.audioUrl]); // Depend on both possible audio URLs

  const audioUrl = item.formatted?.file?.url || item.audioUrl; // Use TTS audio if available, otherwise user recording
  const hasAudio = !!audioUrl;
  const showCopyButton = isAssistant && fullText.trim().length > 0 && item.status !== 'in_progress';
  const hasFeedback = !!item.feedback;
  const isPronunciationReference = isAssistant && !!item.referenceText;

  const bubbleStyle = {
    ...styles.messageBubbleBase,
    ...(isAssistant ? styles.messageBubbleAssistant : styles.messageBubbleUser),
    ...(isPronunciationReference ? {
      backgroundColor: 'var(--mantine-color-blue-light)', // More distinct background
      border: `1px solid var(--mantine-color-blue-3)`,
      color: 'var(--mantine-color-blue-9)',
    } : {})
  };

  const textStyle = {
    ...styles.messageText,
    ...(isPronunciationReference ? {
      fontWeight: 500,
      fontSize: '16px',
      color: 'var(--mantine-color-blue-9)',
    } : {})
  };

  return (
      <motion.div
          variants={bubbleVariants}
          style={{ display: 'flex', flexDirection: 'column', alignItems: isAssistant ? 'flex-start' : 'flex-end', width: '100%' }}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
      >
        {/* Message Bubble */}
        <Box style={bubbleStyle}>
          {isPronunciationReference && (
              <Badge variant="light" color="blue" size="sm" radius="sm" mb="xs" leftSection={<IconMicrophone size={14} stroke={1.5}/>}>
                Practice Saying This
              </Badge>
          )}
          <Text style={textStyle} component="div">
            {isAssistant && item.status === 'in_progress' ? (
                <> {getDisplayText(item)} <span style={{ /* ... typing cursor styles ... */ }}></span> </>
            ) : ( getDisplayText(item) )}
          </Text>
          {item.translation && ( <Text size="xs" mt="xs" c="dimmed" fs="italic">{item.translation}</Text> )}
          {hasAudio && audioUrl && (
              <Box mt="xs" style={{ position: 'relative' }}>
                <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }} onEnded={() => setIsPlayingAudio(false)} onPause={() => setIsPlayingAudio(false)} onPlay={() => setIsPlayingAudio(true)} />
                <Tooltip label={isPlayingAudio ? "Pause" : "Play"} position="top" withArrow>
                  <ActionIcon variant="filled" color="teal" size="md" radius="xl" onClick={toggleAudio}>
                    {isPlayingAudio ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
                  </ActionIcon>
                </Tooltip>
              </Box>
          )}
          <AnimatePresence>
            {isHovering && showCopyButton && (
                <motion.div variants={copyIconVariants} initial="initial" animate="animate" exit="exit" whileHover="hover" style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <Tooltip label={copied ? 'Copied!' : 'Copy text'} withArrow position="top">
                    <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="sm" radius="sm" onClick={handleCopy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Feedback Display */}
        <AnimatePresence>
          {hasFeedback && (
              <motion.div
                  variants={feedbackVariants} initial="hidden" animate="visible" exit="exit"
                  style={{ alignSelf: isAssistant ? 'flex-start' : 'flex-end', width: '100%', maxWidth: '95%', marginTop: '8px', marginLeft: isAssistant ? '8px' : 'auto', marginRight: isAssistant ? 'auto' : '8px' }}
              >
                <FeedbackMessage feedback={item.feedback} />
              </motion.div>
          )}
        </AnimatePresence>

        {/* Timestamp */}
        <Tooltip label={formatFullTimestamp(item.created_at)} position="bottom" withArrow disabled={!item.created_at}>
          <Text mt={hasFeedback ? 2 : 4} style={{ ...styles.messageTimestamp, cursor: item.created_at ? 'help' : 'default' }} onClick={() => setShowFullTimestamp(!showFullTimestamp)}>
            {formatRelativeTimestamp(item.created_at)}
          </Text>
        </Tooltip>
      </motion.div>
  );
};

// Helper Functions
function getDisplayText(item: EnhancedConversationItem): string {
  if (item.referenceText && item.role === 'assistant') { return item.referenceText; }
  if (item.formatted?.transcript) return item.formatted.transcript; // User transcription priority
  if (item.formatted?.text) return item.formatted.text; // Assistant text priority
  if (Array.isArray(item.content)) { // Fallback to content array
    const textContent = item.content.find((c: ContentItem) => c?.type === 'text' || c?.type === 'input_text');
    if (textContent?.text) return textContent.text;
  }
  if (typeof item.content === 'string') return item.content; // Fallback to simple string content
  if (item.role === 'assistant' && item.status === 'in_progress') return '(Thinking...)';
  if (item.role === 'user' && !item.formatted?.transcript) return '(Processing audio...)';
  return ''; // Default empty string
}
function formatRelativeTimestamp(timestamp?: string | number | Date): string { try{const d=new Date(timestamp!);if(isNaN(d.getTime()))return ''; return formatDistanceToNowStrict(d,{addSuffix:true});}catch{return ''} }
function formatFullTimestamp(timestamp?: string | number | Date): string { try{const d=new Date(timestamp!);if(isNaN(d.getTime()))return''; return d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});}catch{return ''} }

export default MessageBubble;