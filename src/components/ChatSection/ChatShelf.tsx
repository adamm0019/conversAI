import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react'; 
import {
    Box, Text, Stack, Group, ActionIcon, Modal, Button, TextInput,
    ScrollArea, Tooltip, useMantineTheme, LoadingOverlay
} from '@mantine/core';
import {motion, AnimatePresence} from 'framer-motion';
import {
    IconLayoutSidebarLeftExpand, IconMessageCircle, IconEdit,
    IconPlus, IconTrash, IconX
} from '@tabler/icons-react';
import {styles} from './styles'; 
import {useSupabaseChat, Chat} from '../../lib/supabase/supabaseClient'; 
import {formatDistanceToNow, isToday, isYesterday, format} from 'date-fns';
import {useDebouncedState} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';


interface ChatShelfProps {
    activeChat: string;
    onSelectChat: (id: string) => void;
    onCloseChat: (id: string) => void;
    onNewChat: () => void;
}

interface GroupedChats {
    [key: string]: Chat[];
}


const shelfVariants = {closed: {x: '-100%'}, open: {x: 0}};
const shelfTransition = {type: 'spring', stiffness: 400, damping: 40, mass: 0.8};
const chatItemVariants = {
    initial: {opacity: 0, x: -15},
    animate: {opacity: 1, x: 0, transition: {duration: 0.25, ease: 'easeOut'}},
    exit: {opacity: 0, x: -15, transition: {duration: 0.15, ease: 'easeIn'}}
};


const groupChatsByDateLogic = (chatsToGroup: Chat[]): GroupedChats => {
    const groups: GroupedChats = {};
    const now = new Date();
    chatsToGroup.forEach(chat => {
        if (!chat.timestamp) return;
        let date: Date;
        try {
            date = chat.timestamp instanceof Date 
                ? chat.timestamp 
                : new Date(chat.timestamp);
                
            if (isNaN(date.getTime())) throw new Error("Invalid date");
        } catch (e) {
            return;
        } 

        let groupKey: string;
        if (isToday(date)) {
            groupKey = 'Today';
        } else if (isYesterday(date)) {
            groupKey = 'Yesterday';
        } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
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


const formatTimestamp = (timestamp: Date | string | null): string => {
    if (!timestamp) return '';
    try {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        if (isToday(date)) return format(date, 'p');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    } catch {
        return 'Recently';
    }
};

interface ChatItemProps {
    chat: Chat;
    isActive: boolean;
    onSelectChat: (id: string) => void;
    onRenameClick: (chat: Chat, e: React.MouseEvent) => void;
    onDeleteClick: (chat: Chat, e: React.MouseEvent) => void;
}

const ChatItem: React.FC<ChatItemProps> = React.memo(({
                                                          chat,
                                                          isActive,
                                                          onSelectChat,
                                                          onRenameClick,
                                                          onDeleteClick,
                                                          
                                                      }) => {
    
    const iconStyle = isActive ? {...styles.chatTabIcon, ...styles.chatTabIconActive} : styles.chatTabIcon;
    const hoverBg = isActive ? undefined : 'rgba(var(--mantine-color-dark-5-rgb), 0.4)'; 

    return (
        <motion.div
            key={chat.id} 
            variants={chatItemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position" 
            style={styles.chatTab}
            data-active={isActive || undefined} 
            onClick={() => onSelectChat(chat.id)}
            whileHover={{backgroundColor: hoverBg}}
            title={`Chat: ${chat.title}\nLast message: ${chat.lastMessage || chat.subtitle || '...'}`}
        >
            <Box style={styles.chatTabHeader}>
                <Group gap="xs" style={styles.chatTabTitleGroup} wrap="nowrap">
                    <IconMessageCircle size={16} stroke={1.5} style={iconStyle}/>
                    <Text style={styles.chatTabTitle}>{chat.title || 'Untitled Chat'}</Text>
                </Group>
                {/* Action Icons - Show on Hover (via parent CSS selector in styles.ts) */}
                <Group gap={0} style={styles.chatTabActions} wrap="nowrap">
                    <Tooltip label="Rename" withArrow position="top" openDelay={500}>
                        <ActionIcon variant="subtle" size="sm" color="gray" onClick={(e) => onRenameClick(chat, e)}>
                            <IconEdit size={16} stroke={1.5}/>
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete" withArrow position="top" openDelay={500}>
                        <ActionIcon variant="subtle" size="sm" color="red" onClick={(e) => onDeleteClick(chat, e)}>
                            <IconTrash size={16} stroke={1.5}/>
                        </ActionIcon>
                    </Tooltip>
                    {/* Optional: Archive Icon
                    <Tooltip label="Archive" withArrow position="top" openDelay={500}>
                        <ActionIcon variant="subtle" size="sm" color="gray" onClick={(e) => onCloseClick(chat.id, e)}>
                            <IconX size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip> */}
                </Group>
            </Box>
            <Text style={styles.chatTabSubtitle}>{chat.lastMessage || chat.subtitle || 'No messages yet'}</Text>
            <Box style={styles.chatTabFooter}>
                <Text style={styles.chatTabTimestamp}>{formatTimestamp(chat.timestamp)}</Text>
            </Box>
        </motion.div>
    );
});
ChatItem.displayName = 'ChatItem'; 




export const ChatShelf: React.FC<ChatShelfProps> = React.memo(({ 
                                                                   activeChat,
                                                                   onSelectChat,
                                                                   onCloseChat,
                                                                   onNewChat
                                                               }) => {
    
    const [isOpen, setIsOpen] = useDebouncedState(false, 100);
    const [isInteracting, setIsInteracting] = useState(false);
    const [rawChats, setRawChats] = useState<Chat[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [chatToRename, setChatToRename] = useState<Chat | null>(null);
    const [newChatTitle, setNewChatTitle] = useState('');

    
    const shelfRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const interactionTimer = useRef<NodeJS.Timeout | null>(null);

    
    const theme = useMantineTheme();
    const {subscribeToChats, deleteChat, renameChat} = useSupabaseChat();

    
    useEffect(() => {
        setIsLoading(true);
        setLoadError(null);
        
        try {
            const unsubscribe = subscribeToChats((updatedChats) => {
                // Sort chats by timestamp (newest first)
                const sortedChats = updatedChats.sort((a, b) => {
                    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp || 0).getTime();
                    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp || 0).getTime();
                    return timeB - timeA; 
                });
                setRawChats(sortedChats);
                setIsLoading(false);
            });
            
            // Add a demo chat if no chats exist and loading is complete
            setTimeout(() => {
                if (rawChats.length === 0 && !isLoading) {
                    // Create an empty array if nothing was loaded
                    setRawChats([]);
                }
            }, 1500);
            
            return () => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            };
        } catch (error) {
            console.error('Error subscribing to chats:', error);
            setLoadError('Failed to load chats');
            setIsLoading(false);
            setRawChats([]);
            return () => {};
        }
    }, [subscribeToChats]);

    
    const groupedChats = useMemo(() => {
        
        const visibleChats = rawChats.filter(chat => !chat.isArchived);
        return groupChatsByDateLogic(visibleChats);
    }, [rawChats]); 

    
    const handleMouseEnter = useCallback(() => {
        if (interactionTimer.current) clearTimeout(interactionTimer.current);
        setIsOpen(true);
    }, [setIsOpen]);

    const handleMouseLeave = useCallback(() => {
        interactionTimer.current = setTimeout(() => {
            if (!isInteracting) {
                setIsOpen(false);
            }
        }, 200);
    }, [setIsOpen, isInteracting]);

    useEffect(() => { 
        return () => {
            if (interactionTimer.current) clearTimeout(interactionTimer.current);
        };
    }, []);

    
    
    const handleDeleteClick = useCallback((chat: Chat, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsInteracting(true);
        setChatToDelete(chat.id);
        setDeleteModalOpen(true);
    }, []);
    const handleRenameClick = useCallback((chat: Chat, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsInteracting(true);
        setChatToRename(chat);
        setNewChatTitle(chat.title || '');
        setRenameModalOpen(true);
    }, []);

    
    const handleConfirmDelete = async () => {
        if (!chatToDelete) return;
        setIsLoading(true); 
        try {
            await deleteChat(chatToDelete);
            notifications.show({message: 'Chat deleted', color: 'green', autoClose: 2000});
            if (activeChat === chatToDelete) {
                onCloseChat(chatToDelete);
            }
        } catch (error: any) {
        } finally {
            setIsLoading(false);
            closeDeleteModal();
        }
    };
    const handleConfirmRename = async () => {
        if (!chatToRename || !newChatTitle.trim()) return;
        setIsLoading(true);
        try {
            await renameChat(chatToRename.id, newChatTitle.trim());
            notifications.show({message: 'Chat renamed', color: 'green', autoClose: 2000});
        } catch (error: any) {
        } finally {
            setIsLoading(false);
            closeRenameModal();
        }
    };

    
    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setChatToDelete(null);
        setIsInteracting(false);
    };
    const closeRenameModal = () => {
        setRenameModalOpen(false);
        setChatToRename(null);
        setNewChatTitle('');
        setIsInteracting(false);
    };

    return (
        <Box>
            <div ref={triggerRef} style={styles.shelfTrigger}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <IconLayoutSidebarLeftExpand size={24} stroke={1.5} style={styles.shelfTriggerIcon} />
            </div>
            <motion.div 
                ref={shelfRef}
                style={styles.shelf}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={shelfVariants}
                transition={shelfTransition}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <Box style={styles.shelfHeader}>
                    <Text style={{fontSize: '1.1rem', fontWeight: 500}}>Conversations</Text>
                    <Button 
                        variant="subtle" 
                        color="blue" 
                        size="sm"
                        radius="xl"
                        leftSection={<IconPlus size={16} />}
                        onClick={onNewChat}
                        style={styles.newChatButton}
                    >
                        New Chat
                    </Button>
                </Box>
                
                <ScrollArea style={styles.shelfList} scrollbarSize={6} type="hover">
                    <Box style={styles.shelfContent} pos="relative">
                        <LoadingOverlay visible={isLoading} />
                        
                        {loadError && (
                            <Box p="md" mt="lg" ta="center">
                                <Text color="red" size="sm">{loadError}</Text>
                                <Button 
                                    variant="subtle" 
                                    color="blue" 
                                    size="xs"
                                    mt="md"
                                    onClick={onNewChat}
                                >
                                    Start a New Chat
                                </Button>
                            </Box>
                        )}
                        
                        {!isLoading && !loadError && rawChats.length === 0 && (
                            <Box p="md" mt="lg" ta="center">
                                <Text size="sm" color="dimmed">No conversations yet</Text>
                                <Button 
                                    variant="subtle" 
                                    color="blue" 
                                    size="xs"
                                    mt="md"
                                    onClick={onNewChat}
                                >
                                    Start a New Chat
                                </Button>
                            </Box>
                        )}
                        
                        {/* Render chat groups */}
                        {Object.entries(groupedChats).map(([groupName, chats]) => (
                            <Box key={groupName} mb="md">
                                <Text size="xs" color="dimmed" pl="sm" pb="xs" style={styles.dateDividerChat}>{groupName}</Text>
                                <AnimatePresence initial={false}>
                                    {chats.map(chat => (
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
                    </Box>
                </ScrollArea>
                
                {/* Delete Modal */}
                <Modal opened={deleteModalOpen} onClose={closeDeleteModal} title="Delete Chat" centered size="sm">
                    <Text size="sm">Are you sure you want to delete this chat? This action cannot be undone.</Text>
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={closeDeleteModal}>Cancel</Button>
                        <Button color="red" onClick={handleConfirmDelete}>Delete</Button>
                    </Group>
                </Modal>
                
                {/* Rename Modal */}
                <Modal opened={renameModalOpen} onClose={closeRenameModal} title="Rename Chat" centered size="sm">
                    <TextInput
                        value={newChatTitle}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        placeholder="Enter new title"
                        data-autofocus
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={closeRenameModal}>Cancel</Button>
                        <Button color="blue" onClick={handleConfirmRename}>Rename</Button>
                    </Group>
                </Modal>
            </motion.div>
        </Box>
    );
}); 
ChatShelf.displayName = 'ChatShelf'; 

