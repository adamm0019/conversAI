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
import { useState, useEffect } from 'react';

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
  timestamp: Date | Timestamp;
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
      console.error('Error parsing localChats:', e);
      return [];
    }
  });
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  
  // Improved initialization function with better error handling
  const initializeFirebase = async () => {
    try {
      // If we have a userId, try to authenticate with Firebase
      if (userId) {
        const token = await getToken({ template: 'integration_firebase' });
        if (token) {
          await signInWithCustomToken(auth, token);
          console.log('Firebase successfully initialized with user:', userId);
          setIsFirebaseInitialized(true);
          return true;
        } else {
          console.error('Failed to get Firebase token from Clerk');
          return false;
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

  // Improved user profile creation with retry
  const createUserProfile = async (userData: { email: string }) => {
    if (!userId) {
      console.error('Cannot create user profile: No user ID available');
      return null;
    }
    
    try {
      if (!isFirebaseInitialized) {
        console.warn('Firebase not initialized, attempting to initialize before creating profile');
        const initialized = await initializeFirebase();
        if (!initialized) {
          console.error('Firebase initialization failed, cannot create user profile');
          return null;
        }
      }
      
      const userRef = doc(db, 'users', userId);
      const defaultData = {
        userId,
        email: userData.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Use set with merge option to ensure the document is created if it doesn't exist
      await setDoc(userRef, defaultData, { merge: true });
      console.log('User profile created/updated successfully:', userId);
      return defaultData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  // Improved create new chat function with retry
  const createNewChat = async (firstMessage?: EnhancedConversationItem): Promise<string> => {
    try {
      const now = new Date();
      const chatData = {
        id: `chat-${Date.now()}`,
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
          console.warn('Firebase save failed, retrying once more before falling back to local storage:', error);
          
          // Retry once more
          try {
            const chatRef = await addDoc(collection(db, 'chats'), {
              ...chatData,
              timestamp: serverTimestamp(),
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            
            console.log('Chat created in Firebase on second attempt with ID:', chatRef.id);
            return chatRef.id;
          } catch (retryError) {
            console.warn('Firebase retry failed, falling back to local storage:', retryError);
          }
        }
      }
      
      // Local storage fallback - This runs if Firebase is not initialized or if the Firebase operations failed
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

  // Improved add message to chat with better error handling
  const addMessageToChat = async (chatId: string, message: EnhancedConversationItem) => {
    try {
      const now = new Date().toISOString();
      
      // Try to use Firebase if initialized and if the chat ID doesn't start with 'local-' or 'chat-'
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-') && !chatId.startsWith('chat-')) {
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
          console.log('Message added to Firebase chat:', chatId);
          return true;
        } catch (error) {
          console.warn('Firebase update failed, retrying once before falling back to local storage:', error);
          
          // Retry once
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
            console.log('Message added to Firebase chat on retry:', chatId);
            return true;
          } catch (retryError) {
            console.warn('Firebase retry failed, falling back to local storage:', retryError);
          }
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
      console.log('Message added to local chat:', chatId);
      return true;
    } catch (error) {
      console.error('Error adding message to chat:', error);
      return false;
    }
  };

  // The rest of the functions remain largely the same, with improved error handling
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
          const firebaseChats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Chat[];
          
          console.log(`Retrieved ${firebaseChats.length} chats from Firebase`);
          return firebaseChats;
        } catch (error) {
          console.warn('Firebase query failed, falling back to local storage:', error);
        }
      }
      
      // Local storage fallback
      console.log(`Retrieved ${localChats.length} chats from local storage`);
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
            console.log(`Firebase subscription updated: ${chats.length} chats`);
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
      }
    }
    
    // Local storage fallback
    // Return dummy unsubscribe function
    console.log(`Local subscription: ${localChats.length} chats`);
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
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-') && !chatId.startsWith('chat-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            isArchived: true,
            updated_at: serverTimestamp()
          });
          console.log('Chat archived in Firebase:', chatId);
          return true;
        } catch (error) {
          console.warn('Firebase archive failed, falling back to local storage:', error);
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, isArchived: true } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat archived locally:', chatId);
      return true;
    } catch (error) {
      console.error('Error archiving chat:', error);
      return false;
    }
  };

  const markChatAsRead = async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-') && !chatId.startsWith('chat-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            unread: 0,
            updated_at: serverTimestamp()
          });
          console.log('Chat marked as read in Firebase:', chatId);
          return true;
        } catch (error) {
          console.warn('Firebase mark-as-read failed, falling back to local storage:', error);
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat marked as read locally:', chatId);
      return true;
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return false;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-') && !chatId.startsWith('chat-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await deleteDoc(chatRef);
          console.log('Chat deleted from Firebase:', chatId);
          return true;
        } catch (error) {
          console.warn('Firebase delete failed, falling back to local storage:', error);
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.filter(chat => chat.id !== chatId);
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat deleted locally:', chatId);
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      // Try to use Firebase if initialized
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-') && !chatId.startsWith('chat-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            title: newTitle,
            updated_at: serverTimestamp()
          });
          console.log('Chat renamed in Firebase:', chatId);
          return true;
        } catch (error) {
          console.warn('Firebase rename failed, falling back to local storage:', error);
        }
      }
      
      // Local storage fallback
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle, updated_at: new Date() } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
      console.log('Chat renamed locally:', chatId);
      return true;
    } catch (error) {
      console.error('Error renaming chat:', error);
      return false;
    }
  };

  // Effect to sync localStorage with state
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'localChats' && e.newValue) {
        try {
          const updatedChats = JSON.parse(e.newValue);
          setLocalChats(updatedChats);
        } catch (e) {
          console.error('Error parsing localChats from storage event:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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