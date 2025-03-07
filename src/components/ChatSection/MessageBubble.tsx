import React from 'react';
import { Box, Text } from '@mantine/core';
import { styles } from './styles';
import { EnhancedConversationItem, ContentItem } from '../../types/conversation';

interface MessageBubbleProps {
  item: EnhancedConversationItem;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const isAssistant = item.role === 'assistant';

  const getDisplayText = () => {
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
  };

  const formatTimestamp = (timestamp: string | number) => {
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
  };

  const wrapperStyle = {
    ...styles.messageBubbleWrapper,
    ...(isAssistant ? {} : styles.messageBubbleWrapperUser),
  };

  const bubbleStyle = {
    ...styles.messageBubbleBase,
    ...(isAssistant ? styles.messageBubbleAssistant : styles.messageBubbleUser),
    opacity: item.status === 'in_progress' ? 0.8 : 1,
  };

  return (
    <Box style={styles.messageContainer}>
      <Box style={wrapperStyle}>
        <Box style={bubbleStyle}>
          <Text style={styles.messageText}>
            {getDisplayText()}
          </Text>
          {item.formatted?.file?.url && (
            <Box mt="xs">
              <audio
                src={item.formatted.file.url}
                controls
                style={styles.messageAudio}
              />
            </Box>
          )}
        </Box>
        <Text style={styles.messageTimestamp}>
          {formatTimestamp(item.created_at)}
        </Text>
      </Box>
    </Box>
  );
};

export default MessageBubble;