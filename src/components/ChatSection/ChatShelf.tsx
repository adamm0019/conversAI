import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Stack, Group, ActionIcon, Modal, Button, TextInput } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX,
  IconMessageCircle,
  IconEdit,
  IconPlus,
  IconTrash,
  IconLayoutSidebarRightExpand,
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

export const ChatShelf: React.FC<ChatShelfProps> = ({
                                                      activeChat,
                                                      onSelectChat,
                                                      onCloseChat,
                                                      onNewChat
                                                    }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [chatToRename, setChatToRename] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

  const { subscribeToChats, archiveChat, deleteChat, renameChat } = useFirebaseChat();
  const shelfRef = useRef<HTMLDivElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);

  // Grouping logic
  useEffect(() => {
    const unsubscribe = subscribeToChats((updatedChats) => {
      setChats(updatedChats);
      groupChatsByDate(updatedChats);
    });
    return () => unsubscribe();
  }, []);

  const groupChatsByDate = (chats: Chat[]) => {
    const groups: GroupedChats = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
    chats.forEach(chat => {
      if (!chat.timestamp) return;
      const date = chat.timestamp instanceof Timestamp ? chat.timestamp.toDate() : new Date(chat.timestamp);
      if (isToday(date)) groups['Today'].push(chat);
      else if (isYesterday(date)) groups['Yesterday'].push(chat);
      else if (new Date().getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000) groups['This Week'].push(chat);
      else groups['Older'].push(chat);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = a.timestamp instanceof Timestamp ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Timestamp ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    });
    setGroupedChats(Object.fromEntries(Object.entries(groups).filter(([, list]) => list.length)));
  };

  const formatTimestamp = (timestamp: Timestamp | Date | number | null) => {
    if (!timestamp) return '';
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) date = timestamp.toDate();
      else if (timestamp instanceof Date) date = timestamp;
      else date = new Date(timestamp);
      return isToday(date)
          ? `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
          : formatDistanceToNow(date, { addSuffix: true });
    } catch {
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

  // Auto-open/close shelf based on hover
  useEffect(() => {
    const hoverZone = hoverZoneRef.current;
    if (!hoverZone) return;

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);

    hoverZone.addEventListener('mouseenter', handleMouseEnter);
    shelfRef.current?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hoverZone.removeEventListener('mouseenter', handleMouseEnter);
      shelfRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
      <>
        {/* Hover zone to trigger the shelf open */}
        <div
            ref={hoverZoneRef}
            style={{
              position: 'fixed',
              left: 0,
              top: 60,
              bottom: 0,
              width: '16px',
              zIndex: 50,
              cursor: 'pointer'
            }}
        >
          <IconLayoutSidebarRightExpand size={16} style={{ color: '#909296', position: 'absolute', top: 8, left: 2 }} />
        </div>

        {/* The Shelf */}
        <motion.div
            ref={shelfRef}
            style={{ ...styles.shelf }}
            animate={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div style={styles.shelfContent}>
            <Box mb="xl" mt="xs">
              <Button
                  fullWidth
                  leftSection={<IconPlus size={18} />}
                  variant="light"
                  style={styles.newChatButton}
                  onClick={onNewChat}
              >
                New Chat
              </Button>
            </Box>

            <Stack m="xs">
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
                                  <Text size="sm" fw={500} lineClamp={1}>
                                    {chat.title}
                                  </Text>
                                </Group>
                                <Group gap={4} style={{ opacity: 0.7, transition: 'opacity 0.2s ease' }}>
                                  <ActionIcon size="xs" variant="subtle" onClick={(e) => {
                                    e.stopPropagation();
                                    setChatToRename(chat.id);
                                    setNewChatTitle(chat.title);
                                    setRenameModalOpen(true);
                                  }}>
                                    <IconEdit size={14} />
                                  </ActionIcon>
                                  <ActionIcon size="xs" variant="subtle" onClick={(e) => handleDeleteClick(chat.id, e)}>
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                  <ActionIcon size="xs" variant="subtle" onClick={(e) => handleCloseChat(chat.id, e)}>
                                    <IconX size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>
                              <Text size="xs" c="dimmed" lineClamp={1}>{chat.lastMessage || chat.subtitle}</Text>
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
          </div>
        </motion.div>

        {/* Rename Modal */}
        <Modal opened={renameModalOpen} onClose={() => {
          setRenameModalOpen(false);
          setChatToRename(null);
        }} title="Rename Chat" size="sm">
          <TextInput
              value={newChatTitle}
              onChange={(event) => setNewChatTitle(event.currentTarget.value)}
              placeholder="Enter new chat name"
              data-autofocus
          />
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={() => {
              setRenameModalOpen(false);
              setChatToRename(null);
            }}>
              Cancel
            </Button>
            <Button color="blue" onClick={async () => {
              if (chatToRename && newChatTitle.trim()) {
                await renameChat(chatToRename, newChatTitle.trim());
                setRenameModalOpen(false);
                setChatToRename(null);
              }
            }}>
              Rename
            </Button>
          </Group>
        </Modal>

        {/* Delete Modal */}
        <Modal opened={deleteModalOpen} onClose={() => {
          setDeleteModalOpen(false);
          setChatToDelete(null);
        }} title="Delete Chat" size="sm">
          <Text size="sm" mb="lg">
            Are you sure you want to delete this chat? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={() => {
              setDeleteModalOpen(false);
              setChatToDelete(null);
            }}>
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </Group>
        </Modal>
      </>
  );

  async function handleConfirmDelete() {
    if (chatToDelete) {
      await deleteChat(chatToDelete);
      if (activeChat === chatToDelete) {
        onCloseChat(chatToDelete);
      }
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  }
};

export default ChatShelf;
