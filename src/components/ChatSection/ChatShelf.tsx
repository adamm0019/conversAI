import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react'; // Added useMemo
import {
    Box, Text, Stack, Group, ActionIcon, Modal, Button, TextInput,
    ScrollArea, Tooltip, useMantineTheme, LoadingOverlay
} from '@mantine/core';
import {motion, AnimatePresence} from 'framer-motion';
import {
    IconLayoutSidebarLeftExpand, IconMessageCircle, IconEdit,
    IconPlus, IconTrash, IconX
} from '@tabler/icons-react';
import {styles} from './styles'; // Verify path
import {useFirebaseChat, Chat} from '../../lib/firebase/firebaseConfig'; // Verify path
import {formatDistanceToNow, isToday, isYesterday, format} from 'date-fns';
import {Timestamp} from 'firebase/firestore';
import {useDebouncedState} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';

// --- Component Props ---
interface ChatShelfProps {
    activeChat: string;
    onSelectChat: (id: string) => void;
    onCloseChat: (id: string) => void;
    onNewChat: () => void;
}

interface GroupedChats {
    [key: string]: Chat[];
}

// --- Motion Variants (Outside component) ---
const shelfVariants = {closed: {x: '-100%'}, open: {x: 0}};
const shelfTransition = {type: 'spring', stiffness: 400, damping: 40, mass: 0.8};
const chatItemVariants = {
    initial: {opacity: 0, x: -15},
    animate: {opacity: 1, x: 0, transition: {duration: 0.25, ease: 'easeOut'}},
    exit: {opacity: 0, x: -15, transition: {duration: 0.15, ease: 'easeIn'}}
};

// --- Helper: Grouping Logic (Outside component) ---
const groupChatsByDateLogic = (chatsToGroup: Chat[]): GroupedChats => {
    const groups: GroupedChats = {};
    const now = new Date();
    chatsToGroup.forEach(chat => {
        if (!chat.timestamp) return;
        let date: Date;
        try {
            date = chat.timestamp instanceof Timestamp ? chat.timestamp.toDate() : new Date(chat.timestamp);
            if (isNaN(date.getTime())) throw new Error("Invalid date");
        } catch (e) {
            return;
        } // Skip invalid dates

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

    // Sort groups chronologically
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
    }); // Chats within groups are already sorted by query/initial sort
    return orderedGroups;
};

// --- Helper: Timestamp Formatting (Outside component) ---
const formatTimestamp = (timestamp: Timestamp | Date | number | string | null): string => {
    if (!timestamp) return '';
    try {
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
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
                                                          // onCloseClick
                                                      }) => {
    // Use styles directly from the imported object
    const iconStyle = isActive ? {...styles.chatTabIcon, ...styles.chatTabIconActive} : styles.chatTabIcon;
    const hoverBg = isActive ? undefined : 'rgba(var(--mantine-color-dark-5-rgb), 0.4)'; // Example hover

    return (
        <motion.div
            key={chat.id} // Key is crucial for AnimatePresence and list updates
            variants={chatItemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position" // Animate position changes smoothly
            style={styles.chatTab}
            data-active={isActive || undefined} // For CSS selector styling
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
ChatItem.displayName = 'ChatItem'; // Good practice for memoized components

// ========================================================================
//          MAIN CHAT SHELF COMPONENT
// ========================================================================
export const ChatShelf: React.FC<ChatShelfProps> = React.memo(({ // Wrap main component in React.memo
                                                                   activeChat,
                                                                   onSelectChat,
                                                                   onCloseChat,
                                                                   onNewChat
                                                               }) => {
    // State
    const [isOpen, setIsOpen] = useDebouncedState(false, 100);
    const [isInteracting, setIsInteracting] = useState(false);
    const [rawChats, setRawChats] = useState<Chat[]>([]); // Store raw data from Firebase
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [chatToRename, setChatToRename] = useState<Chat | null>(null);
    const [newChatTitle, setNewChatTitle] = useState('');

    // Refs
    const shelfRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const interactionTimer = useRef<NodeJS.Timeout | null>(null);

    // Hooks
    const theme = useMantineTheme();
    const {subscribeToChats, deleteChat, renameChat} = useFirebaseChat();

    // --- Data Fetching ---
    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = subscribeToChats((updatedChats) => {
            // Sort chats immediately upon receiving updates
            const sortedChats = updatedChats.sort((a, b) => {
                const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp || 0).getTime();
                const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp || 0).getTime();
                return timeB - timeA; // Most recent first
            });
            setRawChats(sortedChats); // Update raw chats state
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [subscribeToChats]);

    // --- Memoized Grouping ---
    const groupedChats = useMemo(() => {
        // console.log("ChatShelf: Recalculating grouped chats..."); // Debug when grouping runs
        const visibleChats = rawChats.filter(chat => !chat.isArchived);
        return groupChatsByDateLogic(visibleChats);
    }, [rawChats]); // Only recalculate when rawChats changes

    // --- Hover Logic ---
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

    useEffect(() => { // Cleanup timer
        return () => {
            if (interactionTimer.current) clearTimeout(interactionTimer.current);
        };
    }, []);

    // --- Memoized Action Handlers ---
    // These handlers are passed to ChatItem, memoizing helps prevent ChatItem re-renders
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

    // Confirm handlers don't need useCallback if not passed down directly
    const handleConfirmDelete = async () => {
        if (!chatToDelete) return;
        setIsLoading(true); // Indicate activity
        try {
            await deleteChat(chatToDelete);
            notifications.show({message: 'Chat deleted', color: 'green', autoClose: 2000});
            if (activeChat === chatToDelete) {
                onCloseChat(chatToDelete);
            }
        } catch (error: any) { /* ... error handling ... */
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
        } catch (error: any) { /* ... error handling ... */
        } finally {
            setIsLoading(false);
            closeRenameModal();
        }
    };

    // Modal close handlers
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
        <>
            {/* Trigger Zone */}
            <motion.div ref={triggerRef} style={styles.shelfTrigger} onHoverStart={handleMouseEnter}
                        onHoverEnd={handleMouseLeave} title="Open Chat History">
                <IconLayoutSidebarLeftExpand size={20} stroke={1.5} style={styles.shelfTriggerIcon}/>
            </motion.div>

            {/* Shelf */}
            <motion.div ref={shelfRef} style={styles.shelf} variants={shelfVariants} initial="closed"
                        animate={isOpen ? "open" : "closed"} transition={shelfTransition}
                        onHoverStart={handleMouseEnter} onHoverEnd={handleMouseLeave} aria-hidden={!isOpen}>
                <Box style={styles.shelfContent}>
                    {/* Shelf Header */}
                    <Box style={styles.shelfHeader}>
                        <Button fullWidth leftSection={<IconPlus size={18} stroke={1.5}/>} variant="light"
                                style={styles.newChatButton} onClick={onNewChat} component={motion.button}
                                whileHover={{scale: 1.03}} whileTap={{scale: 0.97}}>
                            New Chat
                        </Button>
                    </Box>
                    {/* Shelf List */}
                    <ScrollArea style={styles.shelfList} type="auto" scrollbarSize={8} offsetScrollbars="y">
                        <LoadingOverlay visible={isLoading} zIndex={1} overlayProps={{blur: 1}}/>
                        <AnimatePresence mode="popLayout">
                            {Object.entries(groupedChats).map(([group, groupChats]) => (
                                <motion.div key={group} layout>
                                    <Text style={styles.dateDividerChat}>{group}</Text>
                                    {groupChats.map((chat) => (
                                        <ChatItem
                                            key={chat.id} // Key must be here for AnimatePresence direct child
                                            chat={chat}
                                            isActive={activeChat === chat.id}
                                            onSelectChat={onSelectChat} // Passed from parent (should be stable)
                                            onRenameClick={handleRenameClick} // Use memoized handler
                                            onDeleteClick={handleDeleteClick} // Use memoized handler
                                            // onCloseClick={handleCloseClick} // Pass if needed
                                        />
                                    ))}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {!isLoading && rawChats.length === 0 && (
                            <Text c="dimmed" ta="center" size="sm" mt="xl" p="md">No chat history.</Text>)}
                    </ScrollArea>
                </Box>
            </motion.div>

            {/* Modals */}
            <Modal opened={renameModalOpen} onClose={closeRenameModal} title="Rename Chat" centered
                   size="sm" /* ... other props ... */>
                <TextInput value={newChatTitle} onChange={(event) => setNewChatTitle(event.currentTarget.value)}
                           placeholder="Enter new chat name" data-autofocus
                           onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}/>
                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={closeRenameModal}>Cancel</Button>
                    <Button color="blue" onClick={handleConfirmRename}
                            disabled={!newChatTitle.trim() || newChatTitle === chatToRename?.title}
                            loading={isLoading}>Rename</Button>
                </Group>
            </Modal>
            <Modal opened={deleteModalOpen} onClose={closeDeleteModal} title="Delete Chat" centered
                   size="sm">
                <Text size="sm" mb="lg">Permanently delete this chat? This cannot be undone.</Text>
                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
                    <Button color="red" onClick={handleConfirmDelete} loading={isLoading}>Delete</Button>
                </Group>
            </Modal>
        </>
    );
}); // End of React.memo for ChatShelf
ChatShelf.displayName = 'ChatShelf'; // Good practice

// export default ChatShelf; // Uncomment if needed