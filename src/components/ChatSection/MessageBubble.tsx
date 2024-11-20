import React from 'react';
import { Box, Text } from '@mantine/core';
import { chatSectionStyles } from './styles';
import { EnhancedConversationItem, ContentItem } from '../../types/conversation';

interface MessageBubbleProps {
  item: EnhancedConversationItem;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const isAssistant = item.role === 'assistant';

  const getDisplayText = () => {
    console.log('Getting display text for item:', {
      id: item.id,
      role: item.role,
      content: item.content,
      formatted: item.formatted,
      status: item.status
    });

    // For user messages, show transcription or processing state
    if (!isAssistant) {
      if (item.formatted?.transcript) {
        return item.formatted.transcript;
      }
      if (item.formatted?.text) {
        return item.formatted.text;
      }
      if (Array.isArray(item.content)) {
        const textContent = item.content.find((c: ContentItem) => c?.type === 'input_text');
        if (textContent?.text) return textContent.text;
      }
      if (typeof item.content === 'string') {
        return item.content;
      }
      return '(transcribing...)';
    }

    // For assistant messages, show text response or processing state
    if (isAssistant) {
      if (item.formatted?.transcript) {
        return item.formatted.transcript;
      }
      if (item.formatted?.text) {
        return item.formatted.text;
      }
      if (Array.isArray(item.content)) {
        const textContent = item.content.find((c: ContentItem) => c?.type === 'text');
        if (textContent?.text) return textContent.text;
      }
      if (typeof item.content === 'string') {
        return item.content;
      }
      return '(generating response...)';
    }

    return '(processing message)';
  };

  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  };

  const renderContent = () => {
    const displayText = getDisplayText();
    console.log('Rendering message:', {
      id: item.id,
      role: item.role,
      content: item.content,
      formatted: item.formatted,
      status: item.status,
      displayText
    });

    return (
      <>
        <Text size="sm" style={chatSectionStyles.messageText}>
          {displayText}
        </Text>
        {item.formatted?.file?.url && (
          <Box mt="xs">
            <audio 
              src={item.formatted.file.url} 
              controls 
              style={chatSectionStyles.messageAudio}
            />
          </Box>
        )}
        <Text size="xs" style={{ opacity: 0.5, marginTop: 4 }}>
          {formatTimestamp(item.created_at)}
        </Text>
      </>
    );
  };

  const messageContainerStyle = {
    ...chatSectionStyles.messageContainer,
    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
  } as const;

  const messageBubbleStyle = {
    ...chatSectionStyles.messageBubbleBase,
    ...(isAssistant ? chatSectionStyles.messageBubbleAssistant : chatSectionStyles.messageBubbleUser),
    opacity: item.status === 'in_progress' ? 0.8 : 1,
  } as const;

  return (
    <Box style={messageContainerStyle}>
      <div style={messageBubbleStyle}>
        {renderContent()}
      </div>
    </Box>
  );
};
