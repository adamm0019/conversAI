import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  setDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  increment,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { useAuth } from '@clerk/clerk-react';
import { EnhancedConversationItem } from '../../types/conversation';
import { useState } from 'react';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
}

export const useFirebaseChat = () => {
  const { getToken, userId } = useAuth();
  const [localChats, setLocalChats] = useState<Chat[]>(() => {
    try {
      const stored = localStorage.getItem('localChats');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  
  const initializeFirebase = async () => {
    try {
      // If we have a userId, try to authenticate with Firebase
      if (userId) {
        const token = await getToken({ template: 'integration_firebase' });
        if (token) {
          await signInWithCustomToken(auth, token);
          setIsFirebaseInitialized(true);
          return true;
        }
      }
      
      // Firebase auth failed, but we'll continue in local mode
      console.log('Firebase initialization skipped, running in local mode');
      return false;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  };

  const createUserProfile = async (userData: { email: string }) => {
    if (!userId) return null;
    
    try {
      if (!isFirebaseInitialized) {
        console.log('Firebase not initialized, skipping user profile creation');
        return null;
      }
      
      const userRef = doc(db, 'users', userId);
      const defaultData = {
        userId,
        email: userData.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, defaultData, { merge: true });
      return defaultData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  const createNewChat = async (firstMessage?: EnhancedConversationItem): Promise<string> => {
    try {
      const now = new Date();
      const chatData = {
        id: `local-${Date.now()}`,
        title: 'New Chat',
        subtitle: firstMessage
            ? (typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation')
            : 'Empty conversation',
        timestamp: now,
        created_at: now,
        updated_at: now,
        unread: 0,
        isArchived: false,
        messages: firstMessage ? [{
          ...firstMessage,
          timestamp: now.toISOString(),
          created_at: now.toISOString()
        }] : [],
        userId: userId || 'local-user',
        lastMessage: firstMessage
            ? (typeof firstMessage.content === 'string'
                ? firstMessage.content
                : 'Message sent')
            : ''
      };

      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized) {
        try {
          const chatRef = await addDoc(collection(db, 'chats'), {
            ...chatData,
            timestamp: serverTimestamp(),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          
          console.log('Chat created in Firebase with ID:', chatRef.id);
          return chatRef.id;
        } catch (error) {
          console.warn('Firebase save failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = [...localChats, chatData];
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat created locally with ID:', chatData.id);
      return chatData.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw new Error(`Failed to create new chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addMessageToChat = async (chatId: string, message: EnhancedConversationItem) => {
    try {
      const now = new Date().toISOString();
      
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            messages: arrayUnion({ 
              ...message, 
              timestamp: now,
              created_at: now
            }),
            lastMessage: typeof message.content === 'string' 
              ? message.content 
              : 'Message sent',
            updated_at: serverTimestamp(),
            timestamp: serverTimestamp(),
            unread: message.role === 'assistant' ? increment(1) : 0
          });
          return;
        } catch (error) {
          console.warn('Firebase update failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, { ...message, timestamp: now, created_at: now }],
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
  };

  const getUserChats = async () => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized) {
        try {
          const chatsQuery = query(
            collection(db, 'chats'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
          );
          
          const snapshot = await getDocs(chatsQuery);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Chat[];
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
  };

  const subscribeToChats = (callback: (chats: Chat[]) => void) => {
    // Try to use Firebase if initialized
    if (userId && isFirebaseInitialized) {
      try {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );

        return onSnapshot(chatsQuery, 
          (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Chat[];
            callback(chats);
          },
          (error) => {
            console.warn('Firebase subscription error, falling back to local storage:', error);
            // Fallback to local storage
            callback(localChats);
          }
        );
      } catch (error) {
        console.warn('Failed to create Firebase subscription, using local chats:', error);
        // Continue with local storage fallback
      }
    }
    
    // Local storage fallback
    // Return dummy unsubscribe function
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
  };

  const archiveChat = async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            isArchived: true
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
  };

  const markChatAsRead = async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            unread: 0
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
  };

  const deleteChat = async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await deleteDoc(chatRef);
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
  };

  const renameChat = async (chatId: string, newTitle: string) => {
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
        chat.id === chatId ? { ...chat, title: newTitle, updated_at: new Date() } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

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