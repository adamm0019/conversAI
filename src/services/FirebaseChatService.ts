import { useAuth } from '@clerk/clerk-react';
import { db } from '../lib/firebase/firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  onSnapshot, 
  Timestamp, 
  increment,
  startAfter,
  DocumentData
} from 'firebase/firestore';
import { useCallback, useEffect, useRef } from 'react';
import { EnhancedConversationItem } from '../types/conversation';

export interface Chat {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date;
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

export const useFirebaseChatService = () => {
  const { userId } = useAuth();
  const pendingMessages = useRef<Map<string, EnhancedConversationItem[]>>(new Map());
  const batchInterval = useRef<NodeJS.Timeout | null>(null);

  // Process pending messages in batches
  const processPendingMessages = useCallback(async () => {
    if (!userId || pendingMessages.current.size === 0) return;

    try {
      const entriesArray = Array.from(pendingMessages.current.entries());
      pendingMessages.current.clear();

      for (const [chatId, messages] of entriesArray) {
        if (messages.length === 0) continue;

        // Check if chat exists
        const chatRef = doc(db, 'chats', chatId);
        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
          // Chat doesn't exist, create it first
          const firstMessage = messages[0];
          const now = new Date();

          let newChatId = chatId;
          if (chatId.startsWith('local-')) {
            // Create a new doc with auto-generated ID
            const chatsCollection = collection(db, 'chats');
            const newChatRef = await addDoc(chatsCollection, {
              title: 'New Chat',
              subtitle: typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation',
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
              unread: 0,
              is_archived: false,
              user_id: userId,
              last_message: ''
            });
            newChatId = newChatRef.id;
          } else {
            // Use the provided ID
            await setDoc(chatRef, {
              title: 'New Chat',
              subtitle: typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation',
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
              unread: 0,
              is_archived: false,
              user_id: userId,
              last_message: ''
            });
          }

          // Insert all messages
          let lastMessageText = '';
          let messageUnread = 0;

          for (const message of messages) {
            // Keep track of the last message text for updating the chat
            lastMessageText = typeof message.content === 'string' ? message.content : '';
            
            // Count unread assistant messages
            if (message.role === 'assistant') {
              messageUnread++;
            }

            // Insert message
            const messagesCollection = collection(db, 'messages');
            await addDoc(messagesCollection, {
              chat_id: newChatId,
              content: typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content),
              role: message.role,
              created_at: message.created_at ? new Date(message.created_at) : serverTimestamp()
            });
          }

          // Update chat with last message and unread count
          await updateDoc(doc(db, 'chats', newChatId), {
            last_message: lastMessageText.substring(0, 100),
            updated_at: serverTimestamp(),
            unread: increment(messageUnread)
          });
        } else {
          // Chat exists, just add messages
          let lastMessageText = '';
          let messageUnread = 0;

          for (const message of messages) {
            // Keep track of the last message text for updating the chat
            lastMessageText = typeof message.content === 'string' ? message.content : '';
            
            // Count unread assistant messages
            if (message.role === 'assistant') {
              messageUnread++;
            }

            // Insert message
            const messagesCollection = collection(db, 'messages');
            await addDoc(messagesCollection, {
              chat_id: chatId,
              content: typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content),
              role: message.role,
              created_at: message.created_at ? new Date(message.created_at) : serverTimestamp()
            });
          }

          // Update chat with last message and unread count
          await updateDoc(chatRef, {
            last_message: lastMessageText.substring(0, 100),
            updated_at: serverTimestamp(),
            unread: increment(messageUnread)
          });
        }
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }, [userId]);

  // Set up batch processing interval
  useEffect(() => {
    batchInterval.current = setInterval(() => {
      processPendingMessages();
    }, 1000); 

    return () => {
      if (batchInterval.current) {
        clearInterval(batchInterval.current);
      }
    };
  }, [processPendingMessages]);

  // Create user profile
  const createUserProfile = useCallback(async (userData: { email: string }) => {
    if (!userId) return null;

    try {
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfileSnapshot = await getDoc(userProfileRef);
      
      const now = new Date();
      const profileData = {
        user_id: userId,
        email: userData.email || '',
        created_at: userProfileSnapshot.exists() ? userProfileSnapshot.data().created_at : now,
        updated_at: now,
        preferences: {
          theme: 'dark',
          aiVoice: 'alloy',
          language: 'Spanish',
          autoTranscribe: true
        }
      };

      await setDoc(userProfileRef, profileData, { merge: true });
      return profileData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }, [userId]);

  // Create a new chat
  const createNewChat = useCallback(async (firstMessage?: EnhancedConversationItem, options?: {
    title?: string,
    language?: string,
    languageLevel?: string,
    aiModel?: string
  }): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      // Generate an automatic title from the first message
      const autoTitle = firstMessage && typeof firstMessage.content === 'string'
        ? firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30 ? '...' : '')
        : 'New Conversation';

      const now = new Date();
      
      // Create the chat document
      const chatData = {
        title: options?.title || autoTitle,
        subtitle: firstMessage
          ? (typeof firstMessage.content === 'string'
            ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
            : 'New conversation')
          : 'Empty conversation',
        created_at: now,
        updated_at: now,
        unread: 0,
        is_archived: false,
        user_id: userId,
        last_message: firstMessage
          ? (typeof firstMessage.content === 'string'
            ? firstMessage.content
            : 'Message sent')
          : '',
        language: options?.language || 'Spanish',
        language_level: options?.languageLevel || 'Beginner',
        ai_model: options?.aiModel || 'default'
      };

      // Add chat to Firestore
      const chatsCollection = collection(db, 'chats');
      const chatRef = await addDoc(chatsCollection, chatData);
      
      // If a first message was provided, add it to the messages collection
      if (firstMessage) {
        const messagesCollection = collection(db, 'messages');
        await addDoc(messagesCollection, {
          chat_id: chatRef.id,
          content: typeof firstMessage.content === 'string' 
            ? firstMessage.content 
            : JSON.stringify(firstMessage.content),
          role: firstMessage.role,
          created_at: now
        });
      }

      return chatRef.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  }, [userId]);

  // Add a message to a chat
  const addMessageToChat = useCallback((chatId: string, message: EnhancedConversationItem) => {
    if (!userId) throw new Error('User not authenticated');

    // Add to pending messages for batch processing
    const pending = pendingMessages.current.get(chatId) || [];
    pending.push(message);
    pendingMessages.current.set(chatId, pending);
    
    // Return the message so it can be used by the caller
    return message;
  }, [userId]);

  // Get a chat by ID
  const getChat = useCallback(async (chatId: string): Promise<Chat | null> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      // Get chat document
      const chatRef = doc(db, 'chats', chatId);
      const chatSnapshot = await getDoc(chatRef);

      if (!chatSnapshot.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatSnapshot.data();
      
      // Get messages for this chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chat_id', '==', chatId),
        orderBy('created_at', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: EnhancedConversationItem[] = [];
      
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          content: data.content,
          role: data.role,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          object: 'chat.completion.chunk',
          type: 'message',
          formatted: data.formatted || {},
          timestamp: data.created_at?.toDate?.()?.getTime() || Date.now()
        });
      });

      return {
        id: chatSnapshot.id,
        title: chatData.title || 'Untitled Chat',
        subtitle: chatData.subtitle || '',
        timestamp: chatData.updated_at?.toDate?.() || new Date(),
        lastMessage: chatData.last_message || '',
        unread: chatData.unread || 0,
        isArchived: chatData.is_archived || false,
        messages: messages,
        userId: chatData.user_id,
        language: chatData.language,
        languageLevel: chatData.language_level,
        tags: chatData.tags,
        aiModel: chatData.ai_model
      };
    } catch (error) {
      console.error('Error getting chat:', error);
      return null;
    }
  }, [userId]);

  // Get all chats for the current user
  const getChats = useCallback(async (options?: {
    limit?: number,
    includeArchived?: boolean,
    cursor?: any
  }): Promise<Chat[]> => {
    if (!userId) return [];

    try {
      let chatsQuery = query(
        collection(db, 'chats'),
        where('user_id', '==', userId)
      );

      if (!options?.includeArchived) {
        chatsQuery = query(chatsQuery, where('is_archived', '==', false));
      }

      chatsQuery = query(chatsQuery, orderBy('updated_at', 'desc'));

      if (options?.cursor) {
        chatsQuery = query(chatsQuery, startAfter(options.cursor));
      }

      if (options?.limit) {
        chatsQuery = query(chatsQuery, limit(options.limit));
      }

      const chatsSnapshot = await getDocs(chatsQuery);
      const chats: Chat[] = [];

      for (const doc of chatsSnapshot.docs) {
        const data = doc.data();
        
        chats.push({
          id: doc.id,
          title: data.title || 'Untitled Chat',
          subtitle: data.subtitle || '',
          timestamp: data.updated_at?.toDate?.() || new Date(),
          lastMessage: data.last_message || '',
          unread: data.unread || 0,
          isArchived: data.is_archived || false,
          messages: [], // Messages are loaded separately when needed
          userId: data.user_id,
          language: data.language,
          languageLevel: data.language_level,
          tags: data.tags,
          aiModel: data.ai_model
        });
      }

      return chats;
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }, [userId]);

  // Subscribe to chats (realtime updates)
  const subscribeToChats = useCallback((
    callback: (chats: Chat[]) => void,
    options?: {
      limit?: number,
      includeArchived?: boolean
    }
  ) => {
    if (!userId) {
      callback([]);
      return () => {};
    }

    let chatsQuery = query(
      collection(db, 'chats'),
      where('user_id', '==', userId)
    );

    if (!options?.includeArchived) {
      chatsQuery = query(chatsQuery, where('is_archived', '==', false));
    }

    chatsQuery = query(chatsQuery, orderBy('updated_at', 'desc'));

    if (options?.limit) {
      chatsQuery = query(chatsQuery, limit(options.limit));
    }

    // Set up the listener
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chats: Chat[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        chats.push({
          id: doc.id,
          title: data.title || 'Untitled Chat',
          subtitle: data.subtitle || '',
          timestamp: data.updated_at?.toDate?.() || new Date(),
          lastMessage: data.last_message || '',
          unread: data.unread || 0,
          isArchived: data.is_archived || false,
          messages: [], // Messages are loaded separately when needed
          userId: data.user_id,
          language: data.language,
          languageLevel: data.language_level,
          tags: data.tags,
          aiModel: data.ai_model
        });
      });
      
      callback(chats);
    }, (error) => {
      console.error('Error in chat subscription:', error);
      callback([]);
    });

    return unsubscribe;
  }, [userId]);

  // Mark chat as read
  const markChatAsRead = useCallback(async (chatId: string): Promise<boolean> => {
    if (!userId) return false;

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

  // Archive a chat
  const archiveChat = useCallback(async (chatId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        is_archived: true,
        updated_at: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error archiving chat:', error);
      return false;
    }
  }, [userId]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      // First delete all messages for this chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chat_id', '==', chatId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Then delete the chat document
      const chatRef = doc(db, 'chats', chatId);
      await deleteDoc(chatRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }, [userId]);

  // Rename a chat
  const renameChat = useCallback(async (chatId: string, newTitle: string): Promise<boolean> => {
    if (!userId) return false;

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

  return {
    createUserProfile,
    createNewChat,
    addMessageToChat,
    getChat,
    getChats,
    subscribeToChats,
    markChatAsRead,
    archiveChat,
    deleteChat,
    renameChat
  };
}; 