import { useAuth } from '@clerk/clerk-react';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    increment,
    writeBatch,
    getDoc,
    getDocs,
    limit,
    Timestamp,
    DocumentReference
} from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { useCallback, useEffect, useRef } from 'react';
import { EnhancedConversationItem } from '../types/conversation';

// Define Chat interface
export interface Chat {
    id: string;
    title: string;
    subtitle: string;
    timestamp: Date | Timestamp;
    lastMessage?: string;
    unread: number;
    isArchived: boolean;
    messages: EnhancedConversationItem[];
    userId: string;
    language?: string;
    languageLevel?: string;
    tags?: string[];
    aiModel?: string;
}

// Chat service hook
export const useFirebaseChatService = () => {
    const { userId } = useAuth();
    const activeListener = useRef<(() => void) | null>(null);
    const pendingMessages = useRef<Map<string, EnhancedConversationItem[]>>(new Map());
    const batchInterval = useRef<NodeJS.Timeout | null>(null);

    // Batch writes to Firebase to improve performance
    const processPendingMessages = useCallback(async () => {
        if (!userId || pendingMessages.current.size === 0) return;

        try {
            // Process each chat's pending messages
            const entriesArray = Array.from(pendingMessages.current.entries());
            pendingMessages.current.clear();

            for (const [chatId, messages] of entriesArray) {
                if (messages.length === 0) continue;

                const batch = writeBatch(db);
                const chatRef = doc(db, 'chats', chatId);

                // Get the current document to ensure it exists
                const chatDoc = await getDoc(chatRef);
                if (!chatDoc.exists()) {
                    // If chat doesn't exist, create it first
                    const firstMessage = messages[0];
                    const now = new Date().toISOString();

                    const chatData = {
                        title: 'New Chat',
                        subtitle: typeof firstMessage.content === 'string'
                            ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50)
                            : 'New conversation',
                        timestamp: serverTimestamp(),
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        unread: 0,
                        isArchived: false,
                        messages: [],
                        userId: userId,
                        lastMessage: ''
                    };

                    // Create the chat document first
                    await setDoc(chatRef, chatData);
                }

                // Now add all messages in a batch
                let lastMessageText = '';
                let messageUnread = 0;

                // Add each message to the chat
                const formattedMessages = messages.map(message => {
                    // Keep track of the last message for the chat summary
                    lastMessageText = typeof message.content === 'string' ? message.content : '';

                    // Count unread assistant messages
                    if (message.role === 'assistant') {
                        messageUnread++;
                    }

                    // Return formatted message for Firestore
                    return {
                        ...message,
                        timestamp: message.timestamp || Date.now(),
                        created_at: message.created_at || new Date().toISOString()
                    };
                });

                // Update the chat document with the new messages
                batch.update(chatRef, {
                    messages: arrayUnion(...formattedMessages),
                    lastMessage: lastMessageText,
                    updated_at: serverTimestamp(),
                    timestamp: serverTimestamp(),
                    unread: increment(messageUnread)
                });

                // Commit the batch
                await batch.commit();
            }
        } catch (error) {
            console.error('Error processing pending messages:', error);
        }
    }, [userId]);

    // Set up interval for batch processing
    useEffect(() => {
        batchInterval.current = setInterval(() => {
            processPendingMessages();
        }, 1000); // Process every second

        return () => {
            if (batchInterval.current) {
                clearInterval(batchInterval.current);
            }
        };
    }, [processPendingMessages]);

    // Clean up listeners when component unmounts
    useEffect(() => {
        return () => {
            if (activeListener.current) {
                activeListener.current();
            }
        };
    }, []);

    // Initialize user profile if needed
    const createUserProfile = useCallback(async (userData: { email: string }) => {
        if (!userId) return null;

        const userRef = doc(db, 'users', userId);
        const defaultData = {
            userId,
            email: userData.email || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            preferences: {
                theme: 'dark',
                aiVoice: 'alloy',
                language: 'Spanish',
                autoTranscribe: true
            }
        };

        await setDoc(userRef, defaultData, { merge: true });
        return defaultData;
    }, [userId]);

    // Create a new chat session
    const createNewChat = useCallback(async (firstMessage?: EnhancedConversationItem, options?: {
        title?: string,
        language?: string,
        languageLevel?: string,
        aiModel?: string
    }): Promise<string> => {
        if (!userId) throw new Error('User not authenticated');

        // Generate a title based on the first message or use provided title
        const autoTitle = firstMessage && typeof firstMessage.content === 'string'
            ? firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30)
            : 'New Conversation';

        const chatData = {
            title: options?.title || autoTitle,
            subtitle: firstMessage
                ? (typeof firstMessage.content === 'string'
                    ? firstMessage.content.substring(0, 50)
                    : 'New conversation')
                : 'Empty conversation',
            timestamp: serverTimestamp(),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            unread: 0,
            isArchived: false,
            messages: firstMessage ? [{
                ...firstMessage,
                timestamp: firstMessage.timestamp || Date.now(),
                created_at: firstMessage.created_at || new Date().toISOString()
            }] : [],
            userId: userId,
            lastMessage: firstMessage
                ? (typeof firstMessage.content === 'string'
                    ? firstMessage.content
                    : 'Message sent')
                : '',
            language: options?.language || 'Spanish',
            languageLevel: options?.languageLevel || 'Beginner',
            aiModel: options?.aiModel || 'default'
        };

        try {
            const chatRef = await addDoc(collection(db, 'chats'), chatData);
            return chatRef.id;
        } catch (error) {
            console.error('Error creating new chat:', error);
            throw error;
        }
    }, [userId]);

    // Add a message to a chat (optimized for batching)
    const addMessageToChat = useCallback((chatId: string, message: EnhancedConversationItem) => {
        if (!userId) throw new Error('User not authenticated');

        // Get or create the pending messages array for this chat
        const chatMessages = pendingMessages.current.get(chatId) || [];
        chatMessages.push(message);
        pendingMessages.current.set(chatId, chatMessages);

        // If there are many messages or it's been a while, process right away
        if (chatMessages.length >= 5) {
            processPendingMessages();
        }

        // Return the message for immediate UI update
        return message;
    }, [userId, processPendingMessages]);

    // Fetch a specific chat
    const getChat = useCallback(async (chatId: string): Promise<Chat | null> => {
        if (!userId) return null;

        try {
            const chatRef = doc(db, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists() && chatDoc.data().userId === userId) {
                return { id: chatDoc.id, ...chatDoc.data() } as Chat;
            }
            return null;
        } catch (error) {
            console.error('Error fetching chat:', error);
            return null;
        }
    }, [userId]);

    // Get all chats for the user
    const getUserChats = useCallback(async () => {
        if (!userId) return [];

        try {
            const chatsQuery = query(
                collection(db, 'chats'),
                where('userId', '==', userId),
                where('isArchived', '==', false),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(chatsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Chat[];
        } catch (error) {
            console.error('Error fetching user chats:', error);
            return [];
        }
    }, [userId]);

    // Subscribe to chats with realtime updates
    const subscribeToChats = useCallback((callback: (chats: Chat[]) => void) => {
        if (!userId) return () => {};

        // Clean up any existing listener
        if (activeListener.current) {
            activeListener.current();
        }

        try {
            const chatsQuery = query(
                collection(db, 'chats'),
                where('userId', '==', userId),
                where('isArchived', '==', false),
                orderBy('timestamp', 'desc'),
                limit(50) // Limit for performance
            );

            // Set up the new listener
            const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
                const chats = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Chat[];
                callback(chats);
            }, (error) => {
                console.error('Error in chat subscription:', error);
                // If there's an error, return empty array
                callback([]);
            });

            // Store reference to unsubscribe function
            activeListener.current = unsubscribe;
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up chat subscription:', error);
            return () => {};
        }
    }, [userId]);

    // Subscribe to a specific chat
    const subscribeToChatMessages = useCallback((chatId: string, callback: (messages: EnhancedConversationItem[]) => void) => {
        if (!userId) return () => {};

        // Clean up any existing listener
        if (activeListener.current) {
            activeListener.current();
        }

        try {
            const chatRef = doc(db, 'chats', chatId);

            const unsubscribe = onSnapshot(chatRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data.userId === userId) {
                        callback(data.messages || []);
                    }
                }
            }, (error) => {
                console.error(`Error in chat ${chatId} subscription:`, error);
                callback([]);
            });

            // Store reference to unsubscribe function
            activeListener.current = unsubscribe;
            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to chat messages:', error);
            return () => {};
        }
    }, [userId]);

    // Archive a chat (soft delete)
    const archiveChat = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                isArchived: true,
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error archiving chat:', error);
            return false;
        }
    }, [userId]);

    // Mark chat as read
    const markChatAsRead = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                unread: 0,
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error marking chat as read:', error);
            return false;
        }
    }, [userId]);

    // Delete chat permanently
    const deleteChat = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            // Check that the chat belongs to the user before deleting
            const chatRef = doc(db, 'chats', chatId);
            const chatDoc = await getDoc(chatRef);

            if (chatDoc.exists() && chatDoc.data().userId === userId) {
                await deleteDoc(chatRef);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error deleting chat:', error);
            return false;
        }
    }, [userId]);

    // Rename chat
    const renameChat = useCallback(async (chatId: string, newTitle: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                title: newTitle,
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error renaming chat:', error);
            return false;
        }
    }, [userId]);

    // Add tags to a chat
    const addTagsToChat = useCallback(async (chatId: string, tags: string[]) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                tags: arrayUnion(...tags),
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error adding tags to chat:', error);
            return false;
        }
    }, [userId]);

    // Update chat language settings
    const updateChatLanguageSettings = useCallback(async (chatId: string, language: string, level: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                language,
                languageLevel: level,
                updated_at: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating chat language settings:', error);
            return false;
        }
    }, [userId]);

    // Find chats by content
    const searchChats = useCallback(async (searchTerm: string): Promise<Chat[]> => {
        if (!userId || !searchTerm.trim()) return [];

        try {
            // Get all user chats first
            const chatsQuery = query(
                collection(db, 'chats'),
                where('userId', '==', userId),
                limit(100)
            );

            const snapshot = await getDocs(chatsQuery);
            const allChats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Chat[];

            // Client-side search through messages and titles
            return allChats.filter(chat => {
                // Check title
                if (chat.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return true;
                }

                // Check messages
                if (chat.messages && chat.messages.length > 0) {
                    return chat.messages.some(msg => {
                        const content = typeof msg.content === 'string'
                            ? msg.content
                            : msg.formatted?.text || '';
                        return content.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                }

                return false;
            });
        } catch (error) {
            console.error('Error searching chats:', error);
            return [];
        }
    }, [userId]);

    return {
        createUserProfile,
        createNewChat,
        addMessageToChat,
        getChat,
        getUserChats,
        subscribeToChats,
        subscribeToChatMessages,
        archiveChat,
        markChatAsRead,
        deleteChat,
        renameChat,
        addTagsToChat,
        updateChatLanguageSettings,
        searchChats,
        processPendingMessages
    };
};