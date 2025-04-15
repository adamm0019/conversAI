// firebase configuration file for chat and account persistence

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

  const initializeFirebase = async () => {
    try {
      const token = await getToken({ template: 'integration_firebase' });
      if (token) {
        await signInWithCustomToken(auth, token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  };

  const createUserProfile = async (userData: { email: string }) => {
    if (!userId) return null;
    
    const userRef = doc(db, 'users', userId);
    const defaultData = {
      userId,
      email: userData.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(userRef, defaultData, { merge: true });
    return defaultData;
  };

  const createNewChat = async (firstMessage?: EnhancedConversationItem): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    const chatData = {
      title: 'New Chat',
      subtitle: firstMessage
          ? (typeof firstMessage.content === 'string'
              ? firstMessage.content.substring(0, 50) + '...'
              : 'New conversation')
          : 'Empty conversation',
      timestamp: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      unread: 0,
      isArchived: false,
      messages: firstMessage ? [{
        ...firstMessage,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }] : [],
      userId: userId,
      lastMessage: firstMessage
          ? (typeof firstMessage.content === 'string'
              ? firstMessage.content
              : 'Message sent')
          : ''
    };

    // Make sure we're using the 'chats' collection, not 'users'
    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  };

  const addMessageToChat = async (chatId: string, message: EnhancedConversationItem) => {
    if (!userId) throw new Error('User not authenticated');
    
    const chatRef = doc(db, 'chats', chatId);
    const now = new Date().toISOString();
    
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
  };

  const getUserChats = async () => {
    if (!userId) return [];
    
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
  };

  const subscribeToChats = (callback: (chats: Chat[]) => void) => {
    if (!userId) return () => {};

    const chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      callback(chats);
    });
  };

  const archiveChat = async (chatId: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      isArchived: true
    });
  };

  const markChatAsRead = async (chatId: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      unread: 0
    });
  };

  const deleteChat = async (chatId: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      title: newTitle,
      updated_at: serverTimestamp()
    });
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
    renameChat
  };
};