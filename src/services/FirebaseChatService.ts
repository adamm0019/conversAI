import { db } from '../lib/firebase/firebaseConfig';
import { useState, useCallback, useEffect } from 'react';
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  addDoc, getDocs, increment, Timestamp
} from 'firebase/firestore';
import { ConversationItem } from '../types/conversation';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';

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

export const useFirebaseChatService = () => {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.uid;
  const [isLoading, setIsLoading] = useState(false);


  const isFirebaseReady = userId && user && !authLoading;


  const createUserProfile = useCallback(async (userData: { email: string }) => {
    if (!isFirebaseReady || !userData.email) {

      return null;
    }

    try {
      const userProfileRef = doc(db, 'user_profiles', userId);


      const userProfileDoc = await getDoc(userProfileRef);

      if (userProfileDoc.exists()) {

        return userProfileDoc.data();
      }


      const today = new Date().toISOString().split('T')[0];
      const userProfileData = {
        user_id: userId,
        userId: userId,
        email: userData.email,
        displayName: userData.email.split('@')[0],
        photoURL: null,
        created_at: serverTimestamp(),
        createdAt: today,
        updated_at: serverTimestamp(),
        lastActive: today,
        isOnboarded: false,
        streak: {
          currentStreak: 0,
          highestStreak: 0,
          lastInteractionDate: today
        },
        languages: {},
        settings: {
          theme: 'light',
          notifications_enabled: true,
          language_preference: 'en',
          preferredLanguage: 'spanish',
          dailyGoal: 10,
          notifications: true
        },
        userPreferences: {
          motivation: '',
          feedbackStyle: 'Encouraging'
        },

        dynamic_variables: {
          user_name: userData.email.split('@')[0],
          subscription_tier: 'free',
          language_level: 'beginner',
          target_language: 'Spanish',
          days_streak: 0,
          vocabulary_mastered: 0,
          grammar_mastered: 0,
          total_progress: 0
        }
      };

      await setDoc(userProfileRef, userProfileData);


      return userProfileData;
    } catch (error) {

      notifications.show({
        title: 'Profile Creation Error',
        message: 'Failed to create your user profile',
        color: 'red'
      });
      return null;
    }
  }, [userId, isFirebaseReady]);


  const subscribeToChats = useCallback((callback: (chats: Chat[]) => void) => {
    if (!isFirebaseReady) {

      callback([]);
      return () => { };
    }

    setIsLoading(true);

    try {

      const chatsQuery = query(
        collection(db, 'chats'),
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc')
      );


      const unsubscribe = onSnapshot(chatsQuery,
        async (snapshot) => {
          const chatsPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();


            const messagesQuery = query(
              collection(db, 'messages'),
              where('chat_id', '==', doc.id),
              orderBy('created_at', 'asc')
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            const messages: ConversationItem[] = [];

            messagesSnapshot.forEach((msgDoc) => {
              const msgData = msgDoc.data();
              const content = typeof msgData.content === 'string'
                ? msgData.content
                : JSON.parse(msgData.content || '""');

              messages.push({
                id: msgDoc.id,
                object: 'chat.completion',
                role: msgData.role || 'user',
                type: 'message',
                content: content,
                formatted: { text: typeof content === 'string' ? content : JSON.stringify(content) },
                created_at: msgData.created_at ? new Date(msgData.created_at.toDate()).toISOString() : new Date().toISOString(),
                timestamp: msgData.created_at ? msgData.created_at.toDate().getTime() : Date.now(),
                status: 'completed'
              });
            });

            return {
              id: doc.id,
              title: data.title || 'Untitled Chat',
              subtitle: data.subtitle || '',
              timestamp: data.updated_at || new Date(),
              lastMessage: data.last_message || '',
              unread: data.unread || 0,
              isArchived: data.is_archived || false,
              messages: messages,
              userId: data.user_id
            };
          });

          const chats = await Promise.all(chatsPromises);
          setIsLoading(false);
          callback(chats);
        },
        (error) => {

          setIsLoading(false);
          notifications.show({
            title: 'Error loading chats',
            message: 'There was a problem loading your conversations',
            color: 'red'
          });
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {

      setIsLoading(false);
      callback([]);
      return () => { };
    }
  }, [userId, isFirebaseReady]);


  const getChatMessages = useCallback(async (chatId: string): Promise<ConversationItem[]> => {
    if (!isFirebaseReady || !chatId) {
      return [];
    }

    try {

      const chatDoc = await getDoc(doc(db, 'chats', chatId));

      if (!chatDoc.exists() || chatDoc.data().user_id !== userId) {
        return [];
      }


      const messagesQuery = query(
        collection(db, 'messages'),
        where('chat_id', '==', chatId),
        orderBy('created_at', 'asc')
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: ConversationItem[] = [];

      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        const content = typeof data.content === 'string'
          ? data.content
          : JSON.parse(data.content || '""');

        messages.push({
          id: doc.id,
          object: 'chat.completion',
          role: data.role || 'user',
          type: 'message',
          content: content,
          formatted: { text: typeof content === 'string' ? content : JSON.stringify(content) },
          created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
          timestamp: data.created_at ? data.created_at.toDate().getTime() : Date.now(),
          status: 'completed'
        });
      });


      if (chatDoc.data().unread > 0) {
        await updateDoc(doc(db, 'chats', chatId), {
          unread: 0
        });
      }

      return messages;
    } catch (error) {

      notifications.show({
        title: 'Error loading messages',
        message: 'There was a problem loading the conversation',
        color: 'red'
      });
      return [];
    }
  }, [userId, isFirebaseReady]);


  const createNewChat = useCallback(async (firstMessage?: ConversationItem): Promise<string> => {
    if (!isFirebaseReady) {
      return '';
    }

    try {

      const chatRef = await addDoc(collection(db, 'chats'), {
        title: 'New Chat',
        subtitle: firstMessage?.content
          ? (typeof firstMessage.content === 'string'
            ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
            : 'New conversation')
          : 'New conversation',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        unread: 0,
        is_archived: false,
        user_id: userId,
        last_message: ''
      });


      if (firstMessage) {
        await addDoc(collection(db, 'messages'), {
          chat_id: chatRef.id,
          content: typeof firstMessage.content === 'string'
            ? firstMessage.content
            : JSON.stringify(firstMessage.content),
          role: firstMessage.role,
          created_at: firstMessage.created_at ? new Date(firstMessage.created_at) : serverTimestamp()
        });


        const lastMessageText = typeof firstMessage.content === 'string'
          ? firstMessage.content.substring(0, 100)
          : 'Message';

        await updateDoc(chatRef, {
          last_message: lastMessageText,
          updated_at: serverTimestamp()
        });
      }

      return chatRef.id;
    } catch (error) {

      notifications.show({
        title: 'Error creating chat',
        message: 'Failed to create a new conversation',
        color: 'red'
      });
      return '';
    }
  }, [userId, isFirebaseReady]);


  const addMessageToChat = useCallback(async (chatId: string, message: ConversationItem): Promise<boolean> => {
    if (!isFirebaseReady || !chatId) {
      return false;
    }

    try {

      const chatDoc = await getDoc(doc(db, 'chats', chatId));

      if (!chatDoc.exists()) {

        return false;
      }

      if (chatDoc.data().user_id !== userId) {

        return false;
      }


      await addDoc(collection(db, 'messages'), {
        chat_id: chatId,
        content: typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content),
        role: message.role,
        created_at: message.created_at ? new Date(message.created_at) : serverTimestamp()
      });


      const lastMessageText = typeof message.content === 'string'
        ? message.content.substring(0, 100)
        : 'Message';

      await updateDoc(doc(db, 'chats', chatId), {
        last_message: lastMessageText,
        updated_at: serverTimestamp(),

        unread: message.role === 'assistant' ? increment(1) : increment(0)
      });

      return true;
    } catch (error) {

      notifications.show({
        title: 'Error saving message',
        message: 'Failed to save your message',
        color: 'red'
      });
      return false;
    }
  }, [userId, isFirebaseReady]);


  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    if (!isFirebaseReady || !chatId) {
      return false;
    }

    try {

      const chatDoc = await getDoc(doc(db, 'chats', chatId));

      if (!chatDoc.exists() || chatDoc.data().user_id !== userId) {

        return false;
      }


      const messagesQuery = query(
        collection(db, 'messages'),
        where('chat_id', '==', chatId)
      );

      const messagesSnapshot = await getDocs(messagesQuery);


      const messageDeletePromises = messagesSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(messageDeletePromises);


      await deleteDoc(doc(db, 'chats', chatId));

      notifications.show({
        title: 'Chat deleted',
        message: 'The conversation has been deleted',
        color: 'blue'
      });

      return true;
    } catch (error) {

      notifications.show({
        title: 'Error deleting chat',
        message: 'Failed to delete the conversation',
        color: 'red'
      });
      return false;
    }
  }, [userId, isFirebaseReady]);


  const renameChat = useCallback(async (chatId: string, newTitle: string): Promise<boolean> => {
    if (!isFirebaseReady || !chatId || !newTitle.trim()) {
      return false;
    }

    try {

      const chatDoc = await getDoc(doc(db, 'chats', chatId));

      if (!chatDoc.exists() || chatDoc.data().user_id !== userId) {
        
        return false;
      }


      await updateDoc(doc(db, 'chats', chatId), {
        title: newTitle.trim()
      });

      return true;
    } catch (error) {

      notifications.show({
        title: 'Error renaming chat',
        message: 'Failed to rename the conversation',
        color: 'red'
      });
      return false;
    }
  }, [userId, isFirebaseReady]);

  return {
    createUserProfile,
    subscribeToChats,
    getChatMessages,
    createNewChat,
    addMessageToChat,
    deleteChat,
    renameChat,
    isLoading
  };
};