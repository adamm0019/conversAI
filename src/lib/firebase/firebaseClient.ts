import { db } from './firebaseConfig';
import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot, serverTimestamp,
  DocumentReference, Query, DocumentData, Timestamp,
  getDocs
} from 'firebase/firestore';
import { ConversationItem } from '../../types/conversation';
import { useAuth } from '../../contexts/AuthContext';


export interface Chat {
  id: string;
  title: string;
  subtitle: string;
  timestamp: Date | Timestamp;
  lastMessage?: string;
  unread: number;
  isArchived: boolean;
  messages: ConversationItem[];
  userId: string;
}

export const useFirebaseChat = () => {
  const { user } = useAuth();
  const userId = user?.uid;
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

  
  const initializeFirebase = useCallback(async () => {
    if (!userId) {
      
      return false;
    }

    try {
      
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfile = await getDoc(userProfileRef);
      
      if (!userProfile.exists()) {
        
      } else {
        
      }
      
      setIsFirebaseInitialized(true);
      return true;
    } catch (error) {

      return false;
    }
  }, [userId]);

  
  const createUserProfile = useCallback(async (userData: { email: string }) => {
    if (!userId || !userData.email) {
      
      return null;
    }
    
    try {
      const userProfileRef = doc(db, 'user_profiles', userId);
      
      
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        
        return userProfileDoc.data();
      }
      
      
      const userProfileData = {
        user_id: userId,
        email: userData.email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(userProfileRef, userProfileData);
      
      
      return userProfileData;
    } catch (error) {

      return null;
    }
  }, [userId]);

  
  const createNewChat = useCallback(async (firstMessage?: ConversationItem): Promise<string> => {
    try {
      const now = new Date();
      
      
      if (userId && isFirebaseInitialized) {
        try {
          
          
          
          const chatsRef = collection(db, 'chats');
          const newChatRef = doc(chatsRef);
          
          
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
          
          
          await setDoc(newChatRef, chatData);
          
          
          
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
            
          }
          
          return newChatRef.id;
        } catch (error) {          
        }
      }
      
      
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
      
      return chatData.id;
    } catch (error) {

      throw new Error(`Failed to create new chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const addMessageToChat = useCallback(async (chatId: string, message: ConversationItem) => {
    try {
      
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          
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
          
          
          
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            last_message: messageContent.substring(0, 100),
            updated_at: serverTimestamp(),
            unread: message.role === 'assistant' ? 1 : 0
          });
          
          return;
        } catch (error) {
          
        }
      }
      
      
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

    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const getUserChats = useCallback(async () => {
    try {
      
      if (userId && isFirebaseInitialized) {
        try {
          
          const chatsRef = collection(db, 'chats');
          const chatsQuery = query(
            chatsRef,
            where('user_id', '==', userId),
            orderBy('updated_at', 'desc')
          );
          
          const chatsSnapshot = await getDocs(chatsQuery);
          
          if (chatsSnapshot.empty) {
            
            return [];
          }
          
          
          const chats = await Promise.all(chatsSnapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            
            
            const messagesRef = collection(db, 'messages');
            const messagesQuery = query(
              messagesRef,
              where('chat_id', '==', chatDoc.id),
              orderBy('created_at', 'asc')
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            
            
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
          
        }
      }
      
      
      return localChats;
    } catch (error) {

      return [];
    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const subscribeToChats = useCallback((callback: (chats: Chat[]) => void) => {
    
    if (userId && isFirebaseInitialized) {
      try {
        
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        
        const chatsRef = collection(db, 'chats');
        const chatsQuery = query(
          chatsRef,
          where('user_id', '==', userId),
          orderBy('updated_at', 'desc')
        );
        
        
        const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
          const chatsPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            
            
            const messagesRef = collection(db, 'messages');
            const messagesQuery = query(
              messagesRef,
              where('chat_id', '==', chatDoc.id),
              orderBy('created_at', 'asc')
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            
            
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

        });
        unsubscribeRef.current = unsubscribe;
        return unsubscribe;
      } catch (error) {
        
      }
    }
    
    
    callback(localChats);
    
    
    const storageListener = (e: StorageEvent) => {
      if (e.key === 'localChats' && e.newValue) {
        try {
          const updatedChats = JSON.parse(e.newValue);
          setLocalChats(updatedChats);
          callback(updatedChats);
        } catch (e) {

        }
      }
    };
    
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, [userId, isFirebaseInitialized, localChats]);

  
  const archiveChat = useCallback(async (chatId: string) => {
    try {
      
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            is_archived: true,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          
        }
      }
      
      
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, isArchived: true } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {

    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const markChatAsRead = useCallback(async (chatId: string) => {
    try {
      
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            unread: 0,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          
        }
      }
      
      
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {

    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const deleteChat = useCallback(async (chatId: string) => {
    try {
      
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          
          const messagesRef = collection(db, 'messages');
          const messagesQuery = query(messagesRef, where('chat_id', '==', chatId));
          const messagesSnapshot = await getDocs(messagesQuery);
          
          const deleteMessagePromises = messagesSnapshot.docs.map(messageDoc => 
            deleteDoc(doc(db, 'messages', messageDoc.id))
          );
          
          await Promise.all(deleteMessagePromises);
          
          
          await deleteDoc(doc(db, 'chats', chatId));
          return;
        } catch (error) {
          
        }
      }
      
      
      const updatedChats = localChats.filter(chat => chat.id !== chatId);
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {

    }
  }, [userId, isFirebaseInitialized, localChats]);

  
  const renameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      
      if (userId && isFirebaseInitialized && !chatId.startsWith('local-')) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            title: newTitle,
            updated_at: serverTimestamp()
          });
          return;
        } catch (error) {
          
        }
      }
      
      
      const updatedChats = localChats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      );
      setLocalChats(updatedChats);
      localStorage.setItem('localChats', JSON.stringify(updatedChats));
    } catch (error) {

    }
  }, [userId, isFirebaseInitialized, localChats]);

  
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