import React, { useState, useEffect } from 'react';
import { Box, Text, Stack, Group, ActionIcon, Modal, Button, TextInput } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconX, 
  IconChevronRight, 
  IconMessageCircle, 
  IconEdit, 
  IconPlus, 
  IconTrash 
} from '@tabler/icons-react';
import { styles } from './styles';
import { useFirebaseChat, Chat } from '../../lib/firebase/firebaseConfig';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ChatShelfProps {
  activeChat: string;
  onSelectChat: (id: string) => void;
  onCloseChat: (id: string) => void;
  onNewChat: () => void;
}

interface GroupedChats {
  [key: string]: Chat[];
}

export const ChatShelf = ({ activeChat, onSelectChat, onCloseChat, onNewChat }: ChatShelfProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({});

  const { subscribeToChats, archiveChat, deleteChat, renameChat } = useFirebaseChat();

  useEffect(() => {
    const unsubscribe = subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      groupChatsByDate(updatedChats);
    });

    return () => unsubscribe();
  }, []);

  const isWithinLastWeek = (date: Date) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date > weekAgo;
  };

  const groupChatsByDate = (chats: Chat[]) => {
    const groups: GroupedChats = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    };

    chats.forEach(chat => {
      if (!chat.timestamp) return;
      
      const date = chat.timestamp instanceof Timestamp 
        ? chat.timestamp.toDate() 
        : new Date(chat.timestamp);

      if (isToday(date)) {
        groups['Today'].push(chat);
      } else if (isYesterday(date)) {
        groups['Yesterday'].push(chat);
      } else if (isWithinLastWeek(date)) {
        groups['This Week'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = a.timestamp instanceof Timestamp ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Timestamp ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    });

    const filteredGroups = Object.fromEntries(
      Object.entries(groups).filter(([_, groupChats]) => groupChats.length > 0)
    );

    setGroupedChats(filteredGroups);
  };

  const formatTimestamp = (timestamp: Timestamp | Date | number | null) => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }

      if (isToday(date)) {
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'recently';
    }
  };

  const handleCloseChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveChat(chatId);
    onCloseChat(chatId);
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (chatToDelete) {
      await deleteChat(chatToDelete);
      if (activeChat === chatToDelete) {
        onCloseChat(chatToDelete);
      }
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <>
      <Box
        style={styles.shelf}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <motion.div
          style={styles.shelfArrow}
          animate={{
            x: isOpen ? '320px' : '0px',
            rotate: isOpen ? 180 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <IconChevronRight size={28} style={{ color: '#909296' }} />
        </motion.div>

        <motion.div
          style={styles.shelfContent}
          animate={{
            x: isOpen ? '0%' : '-100%'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Stack m={0}>
            <Box style={styles.newChatButton} onClick={onNewChat}>
              <IconPlus size={20} style={{ opacity: 0.7 }} />
              <Text size="sm">New Chat</Text>
            </Box>

            {Object.entries(groupedChats).map(([group, groupChats]) => (
              <Box key={group}>
                <Text style={styles.dateDividerChat}>{group}</Text>
                <AnimatePresence mode="popLayout">
                  {groupChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <Box
                        style={{
                          ...styles.chatTab,
                          ...(activeChat === chat.id ? styles.chatTabActive : {}),
                        }}
                        onClick={() => onSelectChat(chat.id)}
                      >
                        <Group justify="space-between" mb={8}>
                          <Group gap="xs">
                            <IconMessageCircle size={16} style={{ opacity: 0.7 }} />
                            <Text size="sm" fw={500}>
                              {chat.title}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToRename(chat.id);
                                setNewChatTitle(chat.title);
                                setRenameModalOpen(true);
                              }}
                            >
                              <IconEdit size={14} style={{ opacity: 0.7 }} />
                            </ActionIcon>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              onClick={(e) => handleDeleteClick(chat.id, e)}
                            >
                              <IconTrash size={14} style={{ opacity: 0.7 }} />
                            </ActionIcon>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              onClick={(e) => handleCloseChat(chat.id, e)}
                            >
                              <IconX size={14} style={{ opacity: 0.7 }} />
                            </ActionIcon>
                          </Group>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {chat.lastMessage || chat.subtitle}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4} style={{ opacity: 0.7 }}>
                          {formatTimestamp(chat.timestamp)}
                        </Text>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            ))}
          </Stack>
        </motion.div>
      </Box>

      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setChatToDelete(null);
        }}
        title="Delete Chat"
        size="sm"
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete this chat? This action cannot be undone.
        </Text>
        <Group justify="flex-end" mt="xl">
          <Button
            variant="light"
            onClick={() => {
              setDeleteModalOpen(false);
              setChatToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setChatToRename(null);
        }}
        title="Rename Chat"
        size="sm"
      >
        <TextInput
          value={newChatTitle}
          onChange={(event) => setNewChatTitle(event.currentTarget.value)}
          placeholder="Enter new chat name"
          data-autofocus
        />
        <Group justify="flex-end" mt="xl">
          <Button
            variant="light"
            onClick={() => {
              setRenameModalOpen(false);
              setChatToRename(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={async () => {
              if (chatToRename && newChatTitle.trim()) {
                await renameChat(chatToRename, newChatTitle.trim());
                setRenameModalOpen(false);
                setChatToRename(null);
              }
            }}
          >
            Rename
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default ChatShelf;