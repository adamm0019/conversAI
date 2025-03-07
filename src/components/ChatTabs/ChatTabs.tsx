import React from 'react';
import { Group, Paper, Text, ScrollArea, ActionIcon, Box, Badge, Tooltip } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconHistory, IconStar, IconArchive, IconX } from '@tabler/icons-react';

interface ChatTab {
  id: string;
  title: string;
  type: 'current' | 'saved' | 'archived';
  lastMessage: string;
  timestamp: string;
  unread?: number;
}

interface ChatTabsProps {
  activeChat: string;
  onSelectChat: (id: string) => void;
  onCloseChat: (id: string) => void;
}

export const ChatTabs = ({ activeChat, onSelectChat, onCloseChat }: ChatTabsProps) => {
  const chats: ChatTab[] = [
    {
      id: 'current',
      title: 'Current Chat',
      type: 'current',
      lastMessage: 'Active conversation',
      timestamp: 'Now',
    },
    {
      id: 'saved1',
      title: 'Grammar Practice',
      type: 'saved',
      lastMessage: 'Past perfect tense discussion',
      timestamp: '2h ago',
      unread: 2,
    },
    {
      id: 'archived1',
      title: 'Vocabulary Session',
      type: 'archived',
      lastMessage: 'Word definitions and usage',
      timestamp: '1d ago',
    },
  ];

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'current':
        return null;
      case 'saved':
        return <IconStar size={16} />;
      case 'archived':
        return <IconArchive size={16} />;
      default:
        return <IconHistory size={16} />;
    }
  };

  return (
    <Paper 
      shadow="sm" 
      p="xs" 
      style={{ 
        backgroundColor: '#25262B',
        borderBottom: '1px solid #2C2E33',
      }}
    >
      <ScrollArea>
        <Group gap="xs" p="xs">
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Paper
                p="md"
                onClick={() => onSelectChat(chat.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: activeChat === chat.id ? '#2C2E33' : '#25262B',
                  border: `1px solid ${activeChat === chat.id ? '#3B3D42' : 'transparent'}`,
                  borderRadius: '8px',
                  minWidth: '200px',
                  position: 'relative',
                }}
              >
                <Group p="apart" mb="xs">
                  <Group gap="sm">
                    {getTabIcon(chat.type)}
                    <Text size="sm" fw={500}>
                      {chat.title}
                    </Text>
                    {chat.unread && (
                      <Badge size="sm" variant="filled" color="blue">
                        {chat.unread}
                      </Badge>
                    )}
                  </Group>
                  {chat.type !== 'current' && (
                    <Tooltip label="Close chat">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseChat(chat.id);
                        }}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {chat.lastMessage}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {chat.timestamp}
                </Text>
              </Paper>
            </motion.div>
          ))}
        </Group>
      </ScrollArea>
    </Paper>
  );
};