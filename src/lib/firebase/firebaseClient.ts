import { db } from './firebaseConfig';
import { useAuth } from '@clerk/clerk-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot, serverTimestamp,
  DocumentReference, Query, DocumentData, Timestamp,
  getDocs
} from 'firebase/firestore';
import { EnhancedConversationItem } from '../../types/conversation';

// Chat interface definition
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
}

export const useFirebaseChat = () => {
  const { userId } = useAuth();
  const [localChats, setLocalChats] = useState<Chat[]>(() => {
    try {
      const stored = localStorage.getItem('localChats');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const unsubscribeRef = useRef<() => void | null>();

  // Initialize Firebase chat service
  const initializeFirebase = useCallback(async () => {
    if (!userId) {
      console.log('No user ID, running in local mode');
      return false;
    }

    try {
      // Check if the user exists in our database
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfile = await getDoc(userProfileRef);
      
      if (!userProfile.exists()) {
        console.log('User profile not found in Firebase, will be created when needed');
      } else {
        console.log('User profile found in Firebase');
      }
      
      setIsFirebaseInitialized(true);
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }, [userId]);

  // Create user profile in Firebase
  const createUserProfile = useCallback(async (userData: { email: string }) => {
    if (!userId || !userData.email) {
      console.log('Missing user ID or email, cannot create profile');
      return null;
    }
    
    try {
      const userProfileRef = doc(db, 'user_profiles', userId);
      
      // Check if user profile already exists
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        console.log('User profile already exists, not creating a new one');
        return userProfileDoc.data();
      }
      
      // Create new user profile
      const userProfileData = {
        user_id: userId,
        email: userData.email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(userProfileRef, userProfileData);
      console.log('User profile created in Firebase');
      
      return userProfileData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }, [userId]);

  // Create a new chat
  const createNewChat = useCallback(async (firstMessage?: EnhancedConversationItem): Promise<string> => {
    try {
      const now = new Date();
      
      // If using Firebase
      if (userId && isFirebaseInitialized) {
        try {
          console.log('Creating new chat in Firebase');
          
          // Create a new chat document with auto-generated ID
          const chatsRef = collection(db, 'chats');
          const newChatRef = doc(chatsRef);
          
          // Prepare chat data
          const chatData = {
            title: 'New Chat',
            subtitle: firstMessage
              ? (typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation')
              : 'Empty conversation',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            unread: 0,
            is_archived: false,
            user_id: userId,
            last_message: firstMessage
              ? (typeof firstMessage.content === 'string'
                ? firstMessage.content
                : 'Message sent')
              : ''
          };
          
          // Create the chat
          await setDoc(newChatRef, chatData);
          console.log('Chat created in Firebase with ID:', newChatRef.id);
          
          // Add the first message if provided
          if (firstMessage) {
            const messagesRef = collection(db, 'messages');
            const newMessageRef = doc(messagesRef);
            
            const messageContent = typeof firstMessage.content === 'string'
              ? firstMessage.content
              : JSON.stringify(firstMessage.content);
            
            const messageData = {
              chat_id: newChatRef.id,
              content: messageContent,
              role: firstMessage.role,
              created_at: serverTimestamp()
            };
            
            await setDoc(newMessageRef, messageData);
            console.log('First message added to chat');
          }
          
          return newChatRef.id;
        } catch (error) {
          console.warn('Firebase save failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const chatData: Chat = {
        id: `local-${Date.now()}`,
        title: 'New Chat',
        subtitle: firstMessage
            ? (typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation')
            : 'Empty conversation',
        timestamp: now,
        unread: 0,
        isArchived: false,
        messages: firstMessage ? [{
          ...firstMessage,
          timestamp: now.getTime(),
          created_at: now.toISOString()
        }] : [],
        userId: userId || 'local-user',
        lastMessage: firstMessage
            ? (typeof firstMessage.content === 'string'
                ? firstMessage.content
                : 'Message sent')
            : ''
      };

      const updatedChats = [...localChats, chatData];
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat created locally with ID:', chatData.id);
      return chatData.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw new Error(`Failed to create new chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Add message to chat
  const addMessageToChat = useCallback(async (chatId: string, message: EnhancedConversationItem) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          // Add message to the messages collection
          const messagesRef = collection(db, 'messages');
          const newMessageRef = doc(messagesRef);
          
          const messageContent = typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);
          
          const messageData = {
            chat_id: chatId,
            content: messageContent,
            role: message.role,
            created_at: serverTimestamp()
          };
          
          await setDoc(newMessageRef, messageData);
          console.log('Message added to chat in Firebase');
          
          // Update the chat document
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            last_message: messageContent.substring(0, 100),
            updated_at: serverTimestamp(),
            unread: message.role === 'assistant' ? 1 : 0
          });
          
          return;
        } catch (error) {
          console.warn('Firebase update failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const now = new Date().toISOString();
      const updatedChats = localChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessage = {
            ...message,
            timestamp: Date.now(),
            created_at: now
          };
          return {
            ...chat,
            messages: [...chat.messages, updatedMessage],
            lastMessage: typeof message.content === 'string' ? message.content : 'Message sent',
            updated_at: new Date(),
            timestamp: new Date(),
            unread: message.role === 'assistant' ? (chat.unread || 0) + 1 : 0
          };
        }
        return chat;
      });
      
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error adding message to chat:', error);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Get user chats
  const getUserChats = useCallback(async () => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized) {
        try {
          // Query chats for this user
          const chatsRef = collection(db, 'chats');
          const chatsQuery = query(
            chatsRef,
            where('user_id', '==', userId),
            orderBy('updated_at', 'desc')
          );
          
          const chatsSnapshot = await getDocs(chatsQuery);
          
          if (chatsSnapshot.empty) {
            console.log('No chats found for user');
            return [];
          }
          
          // Process each chat
          const chats = await Promise.all(chatsSnapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            
            // Get messages for this chat
            const messagesRef = collection(db, 'messages');
            const messagesQuery = query(
              messagesRef,
              where('chat_id', '==', chatDoc.id),
              orderBy('created_at', 'asc')
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            
            // Format messages
            const messages = messagesSnapshot.docs.map(messageDoc => {
              const messageData = messageDoc.data();
              return {
                id: messageDoc.id,
                role: messageData.role,
                content: messageData.content,
                timestamp: messageData.created_at ? messageData.created_at.toMillis() : Date.now(),
                created_at: messageData.created_at ? messageData.created_at.toDate().toISOString() : new Date().toISOString(),
                object: 'chat.completion.chunk',
                type: 'message',
                formatted: { text: messageData.content }
              };
            });
            
            return {
              id: chatDoc.id,
              title: chatData.title,
              subtitle: chatData.subtitle,
              timestamp: chatData.updated_at ? chatData.updated_at.toDate() : new Date(),
              lastMessage: chatData.last_message,
              unread: chatData.unread,
              isArchived: chatData.is_archived,
              messages: messages,
              userId: chatData.user_id
            };
          }));
          
          return chats;
        } catch (error) {
          console.warn('Firebase query failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      return localChats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Subscribe to chats (real-time updates)
  const subscribeToChats = useCallback((callback: (chats: Chat[]) => void) => {
    // Try to use Firebase if initialized
    if (userId && isFirebaseInitialized) {
      try {
        // Unsubscribe from previous listener if exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        // Query chats for this user
        const chatsRef = collection(db, 'chats');
        const chatsQuery = query(
          chatsRef,
          where('user_id', '==', userId),
          orderBy('updated_at', 'desc')
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
          const chatsPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            
            // Get messages for this chat
            const messagesRef = collection(db, 'messages');
            const messagesQuery = query(
              messagesRef,
              where('chat_id', '==', chatDoc.id),
              orderBy('created_at', 'asc')
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            
            // Format messages
            const messages = messagesSnapshot.docs.map(messageDoc => {
              const messageData = messageDoc.data();
              return {
                id: messageDoc.id,
                role: messageData.role,
                content: messageData.content,
                timestamp: messageData.created_at ? messageData.created_at.toMillis() : Date.now(),
                created_at: messageData.created_at ? messageData.created_at.toDate().toISOString() : new Date().toISOString(),
                object: 'chat.completion.chunk',
                type: 'message',
                formatted: { text: messageData.content }
              };
            });
            
            return {
              id: chatDoc.id,
              title: chatData.title,
              subtitle: chatData.subtitle,
              timestamp: chatData.updated_at ? chatData.updated_at.toDate() : new Date(),
              lastMessage: chatData.last_message,
              unread: chatData.unread,
              isArchived: chatData.is_archived,
              messages: messages,
              userId: chatData.user_id
            };
          });
          
          const chats = await Promise.all(chatsPromises);
          const formattedChats = chats.map(chat => ({
            ...chat,
            messages: chat.messages.map(message => ({
              ...message,
              type: 'message' as 'message'
            }))
          }));
          callback(formattedChats);
        }, (error) => {
          console.error('Error in chat snapshot listener:', error);
        });
        unsubscribeRef.current = unsubscribe;
        return unsubscribe;
      } catch (error) {
        console.warn('Failed to create Firebase subscription, using local chats:', error);
        // Continue with local storage fallback
      }
    }
    
    // Local storage fallback
    callback(localChats);
    
    // Set up a listener for localStorage changes from other tabs
    const storageListener = (e: StorageEvent) => {
      if (e.key === 'localChats' && e.newValue) {
        try {
          const updatedChats = JSON.parse(e.newValue);
          setLocalChats(updatedChats);
          callback(updatedChats);
        } catch (e) {
          console.error('Error parsing localChats from storage event:', e);
        }
      }
    };
    
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, [userId, isFirebaseInitialized, localChats]);

  // Archive chat
  const archiveChat = useCallback(async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            is_archived: true,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          console.warn('Firebase archive failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, isArchived: true } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Mark chat as read
  const markChatAsRead = useCallback(async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            unread: 0,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          console.warn('Firebase mark-as-read failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Delete chat
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          // Delete all messages in the chat
          const messagesRef = collection(db, 'messages');
          const messagesQuery = query(messagesRef, where('chat_id', '==', chatId));
          const messagesSnapshot = await getDocs(messagesQuery);
          
          const deleteMessagePromises = messagesSnapshot.docs.map(messageDoc => 
            deleteDoc(doc(db, 'messages', messageDoc.id))
          );
          
          await Promise.all(deleteMessagePromises);
          
          // Delete the chat document
          await deleteDoc(doc(db, 'chats', chatId));
          return;
        } catch (error) {
          console.warn('Firebase delete failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.filter(chat => chat.id !== chatId);
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Rename chat
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            title: newTitle,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          console.warn('Firebase rename failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    initializeFirebase,
    createUserProfile,
    createNewChat,
    addMessageToChat,
    getUserChats,
    subscribeToChats,
    archiveChat,
    markChatAsRead,
    deleteChat,
    renameChat,
    isFirebaseInitialized
  };
};