// src/components/ChatSection/MessageBubble.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, ActionIcon, Tooltip, Collapse } from '@mantine/core';
import { IconCopy, IconCheck, IconVolume, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { styles } from './styles'; // Assuming styles.ts is in the same folder or adjust path
import { EnhancedConversationItem, ContentItem } from '../../types/conversation';
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamp

interface MessageBubbleProps {
  item: EnhancedConversationItem;
  // Add any other props passed down, e.g., showTimestamp
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

const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const isAssistant = item.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);

  const fullText = getDisplayText(item); // Simplified call

  // Copy-to-clipboard handler
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubble click events if any
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Audio Play/Pause Toggle
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (audio) {
      if (audio.paused) {
        audio.play().catch(err => console.error("Audio play error:", err));
      } else {
        audio.pause();
      }
    }
  };

  // Effect to sync audio playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlayingAudio(true);
    const handlePause = () => setIsPlayingAudio(false);
    const handleEnded = () => setIsPlayingAudio(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    // Initial check in case state is already playing/paused
    setIsPlayingAudio(!audio.paused);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [item.formatted?.file?.url]); // Re-run if audio URL changes

  const hasAudio = !!item.formatted?.file?.url;
  const showCopyButton = isAssistant && fullText.trim().length > 0 && item.status !== 'in_progress';

  // Combine base and role-specific styles
  const bubbleStyle = {
    ...styles.messageBubbleBase,
    ...(isAssistant ? styles.messageBubbleAssistant : styles.messageBubbleUser),
    // Add specific styles based on state if needed
    // Example: slightly reduced opacity for 'in_progress' handled by parent potentially
  };

  return (
      // The parent EnhancedChatSection handles the main motion.div for layout animation
      // This motion.div handles the individual bubble's appearance animation
      <motion.div
          variants={bubbleVariants}
          // Let parent control initial/animate/exit if using AnimatePresence there
          // initial="hidden"
          // animate="visible"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isAssistant ? 'flex-start' : 'flex-end',
          }}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
      >
        <Box style={bubbleStyle}>
          {/* Main Text Content */}
          <Text style={styles.messageText} component="div"> {/* Use component="div" for block display */}
            {/* Basic Typing Indicator (replace pulseAnimation if needed) */}
            {isAssistant && item.status === 'in_progress' ? (
                <>
                  {getDisplayText(item)}
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: 'currentColor',
                    width: '2px', height: '1em',
                    marginLeft: '4px',
                    opacity: 0.8,
                    animation: `${styles.pulseAnimation} 1s infinite`, // Reference pulse animation
                    verticalAlign: 'text-bottom'
                  }}>
                            </span>
                </>
            ) : (
                getDisplayText(item)
            )}
          </Text>

          {hasAudio && (
              <Box mt="xs" style={{ position: 'relative' }}>
                <audio ref={audioRef} src={item.formatted.file.url} preload="metadata" style={{ display: 'none' }} />
                <Tooltip label={isPlayingAudio ? "Pause audio" : "Play audio"} position="top" withArrow>
                  <ActionIcon
                      variant="filled"
                      color="teal"
                      size="md"
                      radius="xl"
                      onClick={toggleAudio}
                  >
                    {isPlayingAudio ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
                  </ActionIcon>
                </Tooltip>
                {/* Optional: Could add duration/progress here */}
              </Box>
          )}

          {/* Copy Button - Appears on Hover */}
          <AnimatePresence>
            {isHovering && showCopyButton && (
                <motion.div
                    variants={copyIconVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                >
                  <Tooltip label={copied ? 'Copied!' : 'Copy text'} withArrow position="top">
                    <ActionIcon
                        variant="subtle" // Subtle looks good on glass
                        color={copied ? 'teal' : 'gray'} // Change color on copy
                        size="sm"
                        radius="sm"
                        onClick={handleCopy}
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </motion.div>
            )}
          </AnimatePresence>

        </Box>

        {/* Timestamp */}
        <Tooltip label={formatFullTimestamp(item.created_at)} position="bottom" withArrow disabled={!item.created_at}>
          <Text
              mt={4} // Margin top
              style={{
                ...styles.messageTimestamp, // Base timestamp style
                cursor: item.created_at ? 'help' : 'default'
              }}
              onClick={() => setShowFullTimestamp(!showFullTimestamp)}
          >
            {formatRelativeTimestamp(item.created_at)}
          </Text>
        </Tooltip>
      </motion.div>
  );
};

export default MessageBubble;

// --- Helper Functions ---

// Determines the primary text content to display
function getDisplayText(item: EnhancedConversationItem): string {
  // Prioritize formatted transcript or text if available
  if (item.formatted?.transcript) return item.formatted.transcript;
  if (item.formatted?.text) return item.formatted.text;

  // Fallback for assistant 'text' content type
  if (item.role === 'assistant') {
    if (Array.isArray(item.content)) {
      const textContent = item.content.find((c: ContentItem) => c?.type === 'text');
      if (textContent?.text) return textContent.text;
    }
    if (item.status === 'in_progress') return '(Thinking...)'; // Placeholder during generation
  }

  // Fallback for user 'input_text' or 'input_audio' (transcription)
  if (item.role === 'user') {
    if (Array.isArray(item.content)) {
      const textContent = item.content.find((c: ContentItem) => c?.type === 'input_text' || c?.type === 'input_audio');
      // For audio, might return empty string if transcription not done yet
      if (textContent?.text) return textContent.text;
      if (textContent?.type === 'input_audio') return '(Processing audio...)';
    }
  }

  // Generic fallback if content is just a string (less common with structured types)
  if (typeof item.content === 'string') return item.content;

  // Final fallback
  return item.role === 'user' ? '(No input)' : '';
}

// Formats timestamp relative to now (e.g., "5m ago", "Yesterday")
function formatRelativeTimestamp(timestamp?: string | number | Date): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch (e) {
    console.error('Error formatting relative timestamp:', e);
    return '';
  }
}

// Formats timestamp fully (e.g., "Aug 15, 2023, 4:30 PM")
function formatFullTimestamp(timestamp?: string | number | Date): string {
  if (!timestamp) return 'No timestamp available';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, { // Use user's locale
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (e) {
    console.error('Error formatting full timestamp:', e);
    return 'Error formatting date';
  }
}