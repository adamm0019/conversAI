import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useState, useEffect, useCallback } from 'react';
import { EnhancedConversationItem } from '../../types/conversation';

// Initialize Supabase client with basic config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create a basic client for non-authenticated operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// This will be used by components that need to access authenticated endpoints
export function createBrowserClient(supabaseAccessToken: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        apikey: supabaseKey,
      },
    },
  });
}

// Chat interface definition
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

// Database schema info
// chats table: id, title, subtitle, created_at, updated_at, unread, is_archived, user_id, last_message
// messages table: id, chat_id, content, role, timestamp, created_at

export const useSupabaseChat = () => {
  const { userId, getToken } = useAuth();
  const [localChats, setLocalChats] = useState<Chat[]>(() => {
    try {
      const stored = localStorage.getItem('localChats');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(false);
  
  // Debug function to check JWT claims
  const debugJwtClaims = useCallback(async () => {
    try {
      if (!userId) return null;
      
      const token = await getToken();
      if (!token) return null;
      
      const client = createBrowserClient(token);
      const { data, error } = await client.rpc('debug_jwt_claims');
      
      console.log('JWT claims as seen by Supabase:', data);
      if (error) {
        console.error('Error getting JWT claims:', error);
      }
      
      return data;
    } catch (e) {
      console.error('Error debugging JWT claims:', e);
      return null;
    }
  }, [userId, getToken]);
  
  // Helper function to get token and create client
  const getAuthClient = useCallback(async () => {
    if (!userId) return null;
    
    try {
      // Use the default session token instead of a specific template
      const token = await getToken();
      
      if (!token) {
        console.log('No session token available from Clerk');
        return null;
      }
      
      return createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          }
        }
      });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }, [userId, getToken]);

  // Initialize Supabase to work with Clerk
  const initializeSupabase = async () => {
    try {
      if (!userId) {
        console.log('No user ID, running in local mode');
        return false;
      }
      
      // Get default session token - no template needed
      const token = await getToken();
      
      if (!token) {
        console.log('No session token available from Clerk, running in local mode');
        return false;
      }

      // Log JWT token for debugging
      console.log('JWT Token structure:', {
        tokenSubstring: token.substring(0, 20) + '...',
        tokenLength: token.length
      });
      
      // Create a test client to verify the token works
      const testClient = createBrowserClient(token);
      
      // Test the authentication with a simple query
      const { data, error } = await testClient
        .from('chats')
        .select('count');
      
      // Log the result for debugging
      console.log('Test query result:', { data, error });
      
      if (error) {
        console.error('Supabase auth error:', error);
        return false;
      }
      
      console.log('Supabase initialized successfully with Clerk token');
      setIsSupabaseInitialized(true);
      
      // Check JWT claims for debugging
      await debugJwtClaims();
      
      return true;
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return false;
    }
  };

  const createUserProfile = async (userData: { email: string }) => {
    if (!userId || !userData.email) {
      console.log('Missing user ID or email, cannot create profile');
      return null;
    }
    
    try {
      if (!isSupabaseInitialized) {
        console.log('Supabase not initialized, skipping user profile creation');
        return null;
      }
      
      // Get default session token
      const token = await getToken();
      
      if (!token) {
        console.log('No session token available from Clerk');
        return null;
      }
      
      // Create authenticated client
      const client = createBrowserClient(token);

      // Use the RPC function we created in the SQL
      console.log('Using get_or_create_profile RPC with email:', userData.email);
      const { data, error } = await client.rpc('get_or_create_profile', {
        p_user_id: userId,
        p_email: userData.email
      });
      
      if (error) {
        console.error('Error creating/retrieving user profile:', error);
        return null;
      }
      
      console.log('Profile created or retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  const createNewChat = async (firstMessage?: EnhancedConversationItem): Promise<string> => {
    try {
      const now = new Date();
      console.log('Creating new chat with user ID:', userId);
      
      // If using Supabase
      if (userId && isSupabaseInitialized) {
        try {
          console.log('Attempting to create chat in Supabase');
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          // Get user email from userData
          const userEmail = firstMessage?.formatted?.userEmail || '';
          
          // Log the chat data before insertion
          const chatData = {
            title: 'New Chat',
            subtitle: firstMessage
              ? (typeof firstMessage.content === 'string'
                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                : 'New conversation')
              : 'Empty conversation',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            unread: 0,
            is_archived: false,
            user_id: userId,
            last_message: firstMessage
              ? (typeof firstMessage.content === 'string'
                ? firstMessage.content
                : 'Message sent')
              : ''
          };
          
          console.log('Chat data to insert:', chatData);
          
          // Insert the chat
          const { data: chatRecord, error: chatError } = await authClient
            .from('chats')
            .insert(chatData)
            .select()
            .single();
          
          // Log the result
          console.log('Chat insertion result:', { chatRecord, chatError });
          
          if (chatError) {
            console.error('Chat insertion error:', chatError);
            throw chatError;
          }
          
          // If there's a first message, add it
          if (firstMessage && chatRecord.id) {
            console.log('Adding first message to chat:', chatRecord.id);
            const messageContent = typeof firstMessage.content === 'string' 
              ? firstMessage.content 
              : JSON.stringify(firstMessage.content);
            
            const messageData = {
              chat_id: chatRecord.id,
              content: messageContent,
              role: firstMessage.role,
              created_at: now.toISOString()
            };
            
            console.log('Message data to insert:', messageData);
            
            const { data: messageRecord, error: messageError } = await authClient
              .from('messages')
              .insert(messageData)
              .select();
            
            console.log('Message insertion result:', { messageRecord, messageError });
            
            if (messageError) {
              console.warn('Failed to save first message:', messageError);
            }
          }
          
          console.log('Chat created in Supabase with ID:', chatRecord.id);
          return chatRecord.id;
        } catch (error) {
          console.warn('Supabase save failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      } else {
        console.log('Using local storage fallback (Supabase not initialized or no user ID)');
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
      
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized && !chatId.startsWith('local-')) {
        try {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          // 1. Insert message into messages table
          const messageContent = typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content);
          
          const { error: messageError } = await authClient
            .from('messages')
            .insert({
              chat_id: chatId,
              content: messageContent,
              role: message.role,
              created_at: now
            });
            
          if (messageError) {
            throw messageError;
          }
          
          // 2. Update chat record with last message and timestamp
          const { error: chatError } = await authClient
            .from('chats')
            .update({
              last_message: messageContent.substring(0, 100),
              updated_at: now,
              unread: message.role === 'assistant' ? 1 : 0 // Increment unread count
            })
            .eq('id', chatId);
            
          if (chatError) {
            throw chatError;
          }
          
          return;
        } catch (error) {
          console.warn('Supabase update failed, falling back to local storage:', error);
          // Continue with local storage fallback
        }
      }
      
      // Local storage fallback
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
  };

  const getUserChats = async () => {
    try {
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized) {
        try {
          const token = await getToken();
          
          if (!token) {
            throw new Error('No session token available from Clerk');
          }
          
          // Create authenticated client
          const client = createBrowserClient(token);
          
          // Get chats directly using the clerk user_id (text field)
          const { data: chatsData, error: chatsError } = await client
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
          
          if (chatsError) {
            console.error('Failed to fetch chats:', chatsError);
            return [];
          }
          
          if (!chatsData || chatsData.length === 0) {
            console.log('No chats found for user');
            return [];
          }
          
          // For each chat, fetch its messages
          const chatsWithMessages = await Promise.all(chatsData.map(async (chat) => {
            const { data: messagesData, error: messagesError } = await client
              .from('messages')
              .select('*')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: true });
              
            if (messagesError) {
              console.warn(`Failed to fetch messages for chat ${chat.id}:`, messagesError);
              return {
                ...chat,
                id: chat.id,
                title: chat.title,
                subtitle: chat.subtitle,
                timestamp: new Date(chat.updated_at),
                lastMessage: chat.last_message,
                unread: chat.unread,
                isArchived: chat.is_archived,
                messages: [],
                userId: chat.user_id
              };
            }
            
            // Convert Supabase messages to app format
            const formattedMessages = messagesData.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: Date.parse(msg.created_at),
              created_at: msg.created_at,
              // Add other required EnhancedConversationItem fields
              object: 'chat.completion.chunk',
              type: 'message',
              formatted: { text: msg.content }
            }));
            
            return {
              ...chat,
              id: chat.id,
              title: chat.title,
              subtitle: chat.subtitle,
              timestamp: new Date(chat.updated_at),
              lastMessage: chat.last_message,
              unread: chat.unread,
              isArchived: chat.is_archived,
              messages: formattedMessages,
              userId: chat.user_id
            };
          }));
          
          return chatsWithMessages;
        } catch (error) {
          console.warn('Supabase query failed, falling back to local storage:', error);
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
    // Try to use Supabase if initialized
    if (userId && isSupabaseInitialized) {
      try {
        // Initial fetch
        getUserChats().then(chats => {
          callback(chats);
        });

        // Set up real-time subscription
        const setupSubscription = async () => {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }

          const subscription = authClient
            .channel('chats_changes')
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'chats',
                filter: `user_id=eq.${userId}`
              }, 
              () => {
                // Re-fetch chats when anything changes
                getUserChats().then(chats => {
                  callback(chats);
                });
              }
            )
            .subscribe();
          
          return subscription;
        };

        const subscription = setupSubscription();

        return async () => {
          const sub = await subscription;
          if (sub) {
            sub.unsubscribe();
          }
        };
      } catch (error) {
        console.warn('Failed to create Supabase subscription, using local chats:', error);
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
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized && !chatId.startsWith('local-')) {
        try {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          const { error } = await authClient
            .from('chats')
            .update({
              is_archived: true
            })
            .eq('id', chatId);
            
          if (error) {
            throw error;
          }
          
          return;
        } catch (error) {
          console.warn('Supabase archive failed, falling back to local storage:', error);
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
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized && !chatId.startsWith('local-')) {
        try {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          const { error } = await authClient
            .from('chats')
            .update({
              unread: 0
            })
            .eq('id', chatId);
            
          if (error) {
            throw error;
          }
          
          return;
        } catch (error) {
          console.warn('Supabase mark-as-read failed, falling back to local storage:', error);
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
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized && !chatId.startsWith('local-')) {
        try {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          // First delete all messages
          const { error: messagesError } = await authClient
            .from('messages')
            .delete()
            .eq('chat_id', chatId);
            
          if (messagesError) {
            console.warn('Failed to delete messages:', messagesError);
          }
          
          // Then delete the chat
          const { error: chatError } = await authClient
            .from('chats')
            .delete()
            .eq('id', chatId);
            
          if (chatError) {
            throw chatError;
          }
          
          return;
        } catch (error) {
          console.warn('Supabase delete failed, falling back to local storage:', error);
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
      // Try to use Supabase if initialized
      if (userId && isSupabaseInitialized && !chatId.startsWith('local-')) {
        try {
          const authClient = await getAuthClient();
          if (!authClient) {
            throw new Error('Failed to create authenticated client');
          }
          
          const { error } = await authClient
            .from('chats')
            .update({
              title: newTitle,
              updated_at: new Date().toISOString()
            })
            .eq('id', chatId);
            
          if (error) {
            throw error;
          }
          
          return;
        } catch (error) {
          console.warn('Supabase rename failed, falling back to local storage:', error);
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
    initializeSupabase,
    createUserProfile,
    createNewChat,
    addMessageToChat,
    getUserChats,
    subscribeToChats,
    archiveChat,
    markChatAsRead,
    deleteChat,
    renameChat,
    debugJwtClaims,
    isSupabaseInitialized
  };
};