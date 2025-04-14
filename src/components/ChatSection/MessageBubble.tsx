// src/components/ChatSection/MessageBubble.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, ActionIcon, Tooltip, Loader } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { styles, pulseAnimation } from './styles';
import { EnhancedConversationItem, ContentItem } from '../../types/conversation';

interface MessageBubbleProps {
  item: EnhancedConversationItem;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const isAssistant = item.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fullText = getDisplayText(item, isAssistant);

  // Typing animation
  useEffect(() => {
    if (item.status === 'in_progress' && isAssistant) {
      let index = 0;
      setAnimatedText('');
      const interval = setInterval(() => {
        setAnimatedText((prev) => prev + fullText.charAt(index));
        index++;
        if (index >= fullText.length) clearInterval(interval);
      }, 10);
      return () => clearInterval(interval);
    } else {
      setAnimatedText(fullText);
    }
  }, [fullText, item.status, isAssistant]);

  // Copy-to-clipboard handler
  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Audio playback state sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlayingAudio(true);
    const handlePause = () => setIsPlayingAudio(false);
    const handleEnded = () => setIsPlayingAudio(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const wrapperStyle = {
    ...styles.messageBubbleWrapper,
    ...(isAssistant ? {} : styles.messageBubbleWrapperUser),
  };

  const bubbleStyle = {
    ...styles.messageBubbleBase,
    ...(isAssistant ? styles.messageBubbleAssistant : styles.messageBubbleUser),
    opacity: item.status === 'in_progress' ? 0.85 : 1,
    position: 'relative' as const
  };

  return (
      <Box style={styles.messageContainer}>
        <Box style={wrapperStyle}>
          <Box style={bubbleStyle}>
            <Text style={styles.messageText}>
              {item.status === 'in_progress' && isAssistant && animatedText.length < fullText.length ? (
                  <>
                    {animatedText}
                    <span style={{ animation: `${pulseAnimation} 1s infinite` }}>▍</span>
                  </>
              ) : (
                  fullText
              )}
            </Text>

            {/* Copy Button */}
            {isAssistant && fullText.trim().length > 0 && (
                <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
                  <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={handleCopy}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        opacity: 0.4,
                        transition: 'opacity 0.2s ease',
                        '&:hover': { opacity: 1 }
                      }}
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
            )}

            {/* Audio */}
            {item.formatted?.file?.url && (
                <Box mt="xs" style={styles.messageAudio}>
                  <audio ref={audioRef} controls style={{ width: '100%' }} src={item.formatted.file.url} />
                  {isPlayingAudio && (
                      <Box
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 8,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#00BCD4',
                            animation: `${pulseAnimation} 1.5s infinite`,
                          }}
                      />
                  )}
                </Box>
            )}
          </Box>

          {/* Timestamp */}
          <Text style={styles.messageTimestamp}>
            {formatTimestamp(item.created_at)}
          </Text>
        </Box>
      </Box>
  );
};

export default MessageBubble;

// Helpers

function getDisplayText(item: EnhancedConversationItem, isAssistant: boolean): string {
  if (!isAssistant) {
    if (item.formatted?.transcript) return item.formatted.transcript;
    if (item.formatted?.text) return item.formatted.text;
    if (Array.isArray(item.content)) {
      const textContent = item.content.find((c: ContentItem) => c?.type === 'input_text');
      if (textContent?.text) return textContent.text;
    }
    if (typeof item.content === 'string') return item.content;
    return '(transcribing...)';
  }

  if (item.formatted?.transcript) return item.formatted.transcript;
  if (item.formatted?.text) return item.formatted.text;
  if (Array.isArray(item.content)) {
    const textContent = item.content.find((c: ContentItem) => c?.type === 'text');
    if (textContent?.text) return textContent.text;
  }
  if (typeof item.content === 'string') return item.content;
  return '(generating response...)';
}

function formatTimestamp(timestamp: string | number): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return '';
  }
}
