import React, { useState, useEffect, useCallback } from 'react'; 
import {
    Box, Text, Group, ActionIcon, Modal, Button, TextInput,
    ScrollArea, Tooltip, useMantineTheme, LoadingOverlay, Badge,
    Paper, Transition
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconMessageCircle, IconEdit, IconPlus, IconTrash,
    IconChevronRight, IconChevronLeft
} from '@tabler/icons-react';
import { useFirebaseChatService, Chat } from '../../services/FirebaseChatService'; 
import { isToday, isYesterday, format } from 'date-fns';
import { useDebouncedState } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Timestamp } from 'firebase/firestore';

interface ChatShelfProps {
    activeChat: string;
    onSelectChat: (id: string) => void;
    onCloseChat: (id: string) => void;
    onNewChat: () => void;
    children?: React.ReactNode;
}

interface GroupedChats {
    [key: string]: Chat[];
}

const convertToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    try {
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
            return timestamp;
        }
        return new Date(timestamp);
    } catch (e) {

        return null;
    }
};

const formatTimestamp = (timestamp: Date | Timestamp | null): string => {
    const date = convertToDate(timestamp);
    if (!date) return '';
    
    try {
        if (isToday(date)) return format(date, 'p');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    } catch {
        return 'Recently';
    }
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const groups: GroupedChats = {};
    
    chats.forEach(chat => {
        const date = convertToDate(chat.timestamp);
        if (!date) return;

        let groupKey: string;
        if (isToday(date)) {
            groupKey = 'Today';
        } else if (isYesterday(date)) {
            groupKey = 'Yesterday';
        } else if (new Date().getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
            groupKey = 'Previous 7 Days';
        } else {
            groupKey = format(date, 'MMMM yyyy');
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(chat);
    });

    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days'];
    const orderedGroupKeys = Object.keys(groups).sort((a, b) => {
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        try {
            return new Date(b).getTime() - new Date(a).getTime();
        } catch {
            return 0;
        }
    });

    const orderedGroups: GroupedChats = {};
    orderedGroupKeys.forEach(key => {
        orderedGroups[key] = groups[key];
    });
    
    return orderedGroups;
};

const ChatItem = React.memo(({
    chat,
    isActive,
    onSelectChat,
    onRenameClick,
    onDeleteClick,
}: {
    chat: Chat;
    isActive: boolean;
    onSelectChat: (id: string) => void;
    onRenameClick: (chat: Chat, e: React.MouseEvent) => void;
    onDeleteClick: (chat: Chat, e: React.MouseEvent) => void;
}) => {
    const theme = useMantineTheme();
    const accentBlue = theme.colors.primary[6];
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectChat(chat.id)}
            style={{
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                background: isActive 
                    ? `rgba(65, 149, 211, 0.15)`
                    : 'rgba(30, 31, 40, 0.5)',
                backdropFilter: 'blur(8px)',
                border: isActive 
                    ? `1px solid rgba(65, 149, 211, 0.4)`
                    : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease'
            }}
        >
            <Group justify="apart" mb={5} wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                    <Box
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isActive ? 'rgba(65, 149, 211, 0.2)' : 'rgba(255, 255, 255, 0.07)',
                            flexShrink: 0
                        }}
                    >
                        <IconMessageCircle size={16} color={isActive ? accentBlue : undefined} />
                    </Box>
                    <Text fw={600} lineClamp={1}>
                        {chat.title || 'Untitled Chat'}
                    </Text>
                </Group>
                
                <Group gap={4} className="chat-actions">
                    <Tooltip label="Rename" withArrow position="top">
                        <ActionIcon 
                            size="sm" 
                            radius="md"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRenameClick(chat, e);
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.07)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <IconEdit size={14} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete" withArrow position="top">
                        <ActionIcon 
                            size="sm" 
                            radius="md"
                            color="red" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick(chat, e);
                            }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.07)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
            
            <Text size="sm" color="dimmed" lineClamp={1} pl={44} mb={5}>
                {chat.lastMessage || chat.subtitle || 'No messages yet'}
            </Text>
            
            <Group justify="space-between" pl={44}>
                <Text size="xs" color="dimmed">
                    {formatTimestamp(chat.timestamp)}
                </Text>
                {chat.unread > 0 && (
                    <Badge size="sm" radius="xl" variant="filled" gradient={{ from: 'blue', to: 'indigo' }}>
                        {chat.unread}
                    </Badge>
                )}
            </Group>
        </motion.div>
    );
});

export const ChatShelf = ({ 
    activeChat,
    onSelectChat,
    onCloseChat,
    onNewChat,
    children
}: ChatShelfProps) => {
    const [isOpen, setIsOpen] = useDebouncedState(false, 100);
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [chatToRename, setChatToRename] = useState<Chat | null>(null);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const { subscribeToChats, deleteChat, renameChat } = useFirebaseChatService();

    useEffect(() => {
        setIsLoading(true);
        
        try {
            const unsubscribe = subscribeToChats((updatedChats) => {
                const sortedChats = updatedChats
                    .filter(chat => !chat.isArchived)
                    .sort((a, b) => {
                        const dateA = convertToDate(a.timestamp) || new Date(0);
                        const dateB = convertToDate(b.timestamp) || new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    });
                
                setChats(sortedChats);
                setIsLoading(false);
            });
            
            return unsubscribe;
        } catch (error) {

            setError('Failed to load chats');
            setIsLoading(false);
            return () => {};
        }
    }, [subscribeToChats]);

    const handleDeleteClick = useCallback((chat: Chat, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatToDelete(chat.id);
        setDeleteModalOpen(true);
    }, []);
    
    const handleRenameClick = useCallback((chat: Chat, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatToRename(chat);
        setNewChatTitle(chat.title || '');
        setRenameModalOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!chatToDelete) return;
        try {
            await deleteChat(chatToDelete);
            notifications.show({
                message: 'Chat deleted',
                color: 'green'
            });
            
            if (activeChat === chatToDelete) {
                onCloseChat(chatToDelete);
            }
        } catch (error) {
            notifications.show({
                message: 'Failed to delete chat',
                color: 'red'
            });
        } finally {
            setDeleteModalOpen(false);
            setChatToDelete(null);
        }
    };
    
    const handleConfirmRename = async () => {
        if (!chatToRename || !newChatTitle.trim()) return;
        
        try {
            await renameChat(chatToRename.id, newChatTitle.trim());
            notifications.show({
                message: 'Chat renamed',
                color: 'green'
            });
        } catch (error) {
            notifications.show({
                message: 'Failed to rename chat',
                color: 'red'
            });
        } finally {
            setRenameModalOpen(false);
            setChatToRename(null);
            setNewChatTitle('');
        }
    };

    const groupedChats = groupChatsByDate(chats);

    return (
        <>
            {children}
            <Tooltip label={isOpen ? "Close sidebar" : "Open sidebar"} position="right" withArrow>
                <ActionIcon
                    variant="light"
                    radius="xl"
                    size="lg"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'fixed',
                        left: isOpen ? '288px' : '16px',
                        top: '72px',
                        zIndex: 200,
                        background: 'rgba(30, 31, 40, 0.7)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    {isOpen ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
                </ActionIcon>
            </Tooltip>

            <motion.div
                initial={{ x: -280 }}
                animate={{ 
                    x: isOpen ? 0 : -280,
                    transition: { type: 'spring', stiffness: 300, damping: 30 }
                }}
                style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    width: '280px',
                    height: 'calc(100vh - 60px)',
                    background: 'rgba(20, 21, 25, 0.75)',
                    backdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '5px 0 25px rgba(0, 0, 0, 0.3)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <Box p="md" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Button
                        fullWidth
                        leftSection={<IconPlus size={16} />}
                        onClick={onNewChat}
                        gradient={{ from: 'blue', to: 'indigo' }}
                        variant="gradient"
                        radius="md"
                    >
                        New Conversation
                    </Button>
                </Box>
                
                <Box style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                    <LoadingOverlay visible={isLoading} />
                    
                    <ScrollArea style={{ height: '100%' }} offsetScrollbars type="auto">
                        <Box p="md">
                            {error && (
                                <Paper p="md" style={{ background: 'rgba(239, 68, 68, 0.1)', marginBottom: 16 }}>
                                    <Text color="red" size="sm">{error}</Text>
                                </Paper>
                            )}
                            
                            {!isLoading && !error && chats.length === 0 && (
                                <Paper p="md" style={{ background: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
                                    <Text size="sm" color="dimmed">No conversations yet</Text>
                                    <Button size="sm" variant="light" onClick={onNewChat} mt="sm">
                                        Start Your First Chat
                                    </Button>
                                </Paper>
                            )}
                            
                            <AnimatePresence>
                                {Object.entries(groupedChats).map(([groupName, groupChats]) => (
                                    <Box key={groupName} mb="lg">
                                        <Text 
                                            size="xs" 
                                            fw={700} 
                                            tt="uppercase" 
                                            color="dimmed"
                                            mb="xs"
                                            pl="xs"
                                        >
                                            {groupName}
                                        </Text>
                                        
                                        <AnimatePresence initial={false}>
                                            {groupChats.map(chat => (
                                                <ChatItem
                                                    key={chat.id}
                                                    chat={chat}
                                                    isActive={chat.id === activeChat}
                                                    onSelectChat={onSelectChat}
                                                    onRenameClick={handleRenameClick}
                                                    onDeleteClick={handleDeleteClick}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Box>
                                ))}
                            </AnimatePresence>
                        </Box>
                    </ScrollArea>
                </Box>
            </motion.div>
            
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Conversation"
                centered
                size="sm"
            >
                <Text size="sm">Are you sure you want to delete this conversation? This action cannot be undone.</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={handleConfirmDelete}>Delete</Button>
                </Group>
            </Modal>
            
            <Modal
                opened={renameModalOpen}
                onClose={() => setRenameModalOpen(false)}
                title="Rename Conversation"
                centered
                size="sm"
            >
                <TextInput
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.currentTarget.value)}
                    placeholder="Enter a new title"
                    label="Conversation Title"
                    data-autofocus
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setRenameModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmRename} disabled={!newChatTitle.trim()}>Rename</Button>
                </Group>
            </Modal>
        </>
    );
};