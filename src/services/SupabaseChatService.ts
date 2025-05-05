import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase/supabaseClient';
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


export const useSupabaseChatService = () => {
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
                const { data: chatData, error: chatError } = await supabase
                    .from('chats')
                    .select('id')
                    .eq('id', chatId)
                    .single();

                if (chatError && chatError.code === 'PGRST116') {
                    // Chat doesn't exist, create it first
                    const firstMessage = messages[0];
                    const now = new Date().toISOString();

                    const { data: newChat, error: createError } = await supabase
                        .from('chats')
                        .insert({
                            id: chatId.startsWith('local-') ? undefined : chatId,
                            title: 'New Chat',
                            subtitle: typeof firstMessage.content === 'string'
                                ? firstMessage.content.substring(0, 50) + (firstMessage.content.length > 50 ? '...' : '')
                                : 'New conversation',
                            created_at: now,
                            updated_at: now,
                            unread: 0,
                            is_archived: false,
                            user_id: userId,
                            last_message: ''
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Failed to create chat:', createError);
                        continue;
                    }
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
                    const { error: insertError } = await supabase
                        .from('messages')
                        .insert({
                            chat_id: chatId,
                            content: typeof message.content === 'string' 
                                ? message.content 
                                : JSON.stringify(message.content),
                            role: message.role,
                            created_at: message.created_at || new Date().toISOString()
                        });

                    if (insertError) {
                        console.error('Failed to insert message:', insertError);
                    }
                }

                // Update chat with last message and unread count
                const { error: updateError } = await supabase
                    .from('chats')
                    .update({
                        last_message: lastMessageText.substring(0, 100),
                        updated_at: new Date().toISOString(),
                        unread: supabase.rpc('increment_unread', { 
                            chat_id: chatId, 
                            amount: messageUnread 
                        })
                    })
                    .eq('id', chatId);

                if (updateError) {
                    console.error('Failed to update chat:', updateError);
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
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: userId,
                    email: userData.email || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    preferences: {
                        theme: 'dark',
                        aiVoice: 'alloy',
                        language: 'Spanish',
                        autoTranscribe: true
                    }
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
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

            const now = new Date().toISOString();

            // Insert the chat record
            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .insert({
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
                })
                .select()
                .single();

            if (chatError) {
                throw chatError;
            }

            // If a first message was provided, insert it as well
            if (firstMessage) {
                const { error: messageError } = await supabase
                    .from('messages')
                    .insert({
                        chat_id: chat.id,
                        content: typeof firstMessage.content === 'string' 
                            ? firstMessage.content 
                            : JSON.stringify(firstMessage.content),
                        role: firstMessage.role,
                        created_at: now
                    });

                if (messageError) {
                    console.warn('Failed to save first message:', messageError);
                }
            }

            return chat.id;
        } catch (error) {
            console.error('Error creating new chat:', error);
            throw error;
        }
    }, [userId]);

    // Add a message to a chat
    const addMessageToChat = useCallback((chatId: string, message: EnhancedConversationItem) => {
        if (!userId) throw new Error('User not authenticated');

        // Queue the message for batch processing
        const chatMessages = pendingMessages.current.get(chatId) || [];
        chatMessages.push(message);
        pendingMessages.current.set(chatId, chatMessages);

        // If we have enough messages, process them immediately
        if (chatMessages.length >= 5) {
            processPendingMessages();
        }

        return message;
    }, [userId, processPendingMessages]);

    // Get a specific chat
    const getChat = useCallback(async (chatId: string): Promise<Chat | null> => {
        if (!userId) return null;

        try {
            // Get the chat data
            const { data: chatData, error: chatError } = await supabase
                .from('chats')
                .select('*')
                .eq('id', chatId)
                .eq('user_id', userId)
                .single();

            if (chatError) {
                throw chatError;
            }

            // Get the messages for this chat
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (messagesError) {
                throw messagesError;
            }

            // Format messages
            const formattedMessages = messagesData.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.created_at,
                created_at: msg.created_at,
                object: 'chat.completion.chunk',
                type: 'message',
                formatted: { text: msg.content }
            }));

            // Return the formatted chat
            return {
                id: chatData.id,
                title: chatData.title,
                subtitle: chatData.subtitle,
                timestamp: new Date(chatData.updated_at),
                lastMessage: chatData.last_message,
                unread: chatData.unread,
                isArchived: chatData.is_archived,
                messages: formattedMessages,
                userId: chatData.user_id,
                language: chatData.language,
                languageLevel: chatData.language_level,
                aiModel: chatData.ai_model
            };
        } catch (error) {
            console.error('Error fetching chat:', error);
            return null;
        }
    }, [userId]);

    // Get user chats
    const getUserChats = useCallback(async (options?: { 
        includeArchived?: boolean, 
        limit?: number,
        withMessages?: boolean
    }): Promise<Chat[]> => {
        if (!userId) return [];

        try {
            // Query chats
            let query = supabase
                .from('chats')
                .select('*')
                .eq('user_id', userId);

            // Apply filters
            if (!options?.includeArchived) {
                query = query.eq('is_archived', false);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            // Order by updated_at
            query = query.order('updated_at', { ascending: false });

            // Execute the query
            const { data: chatsData, error: chatsError } = await query;

            if (chatsError) {
                throw chatsError;
            }

            // Process the results
            const chats: Chat[] = [];
            for (const chat of chatsData) {
                let messages: any[] = [];

                // Fetch messages if requested
                if (options?.withMessages) {
                    const { data: messagesData, error: messagesError } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('chat_id', chat.id)
                        .order('created_at', { ascending: true });

                    if (!messagesError) {
                        messages = messagesData.map(msg => ({
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            timestamp: msg.created_at,
                            created_at: msg.created_at,
                            object: 'chat.completion.chunk',
                            type: 'message',
                            formatted: { text: msg.content }
                        }));
                    }
                }

                // Add the formatted chat to the list
                chats.push({
                    id: chat.id,
                    title: chat.title,
                    subtitle: chat.subtitle,
                    timestamp: new Date(chat.updated_at),
                    lastMessage: chat.last_message,
                    unread: chat.unread,
                    isArchived: chat.is_archived,
                    messages,
                    userId: chat.user_id,
                    language: chat.language,
                    languageLevel: chat.language_level,
                    aiModel: chat.ai_model
                });
            }

            return chats;
        } catch (error) {
            console.error('Error fetching user chats:', error);
            return [];
        }
    }, [userId]);

    // Subscribe to user chats
    const subscribeToChats = useCallback((callback: (chats: Chat[]) => void, options?: { 
        includeArchived?: boolean 
    }) => {
        if (!userId) return () => {};

        // Initial load
        getUserChats(options).then(callback);

        // Real-time subscription
        const subscription = supabase
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
                    getUserChats(options).then(callback);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId, getUserChats]);

    // Archive a chat
    const archiveChat = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('chats')
                .update({ is_archived: true })
                .eq('id', chatId)
                .eq('user_id', userId);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error archiving chat:', error);
            return false;
        }
    }, [userId]);

    // Rename a chat
    const renameChat = useCallback(async (chatId: string, newTitle: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('chats')
                .update({ 
                    title: newTitle,
                    updated_at: new Date().toISOString()
                })
                .eq('id', chatId)
                .eq('user_id', userId);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error renaming chat:', error);
            return false;
        }
    }, [userId]);

    // Mark a chat as read
    const markChatAsRead = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('chats')
                .update({ unread: 0 })
                .eq('id', chatId)
                .eq('user_id', userId);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error marking chat as read:', error);
            return false;
        }
    }, [userId]);

    // Delete a chat
    const deleteChat = useCallback(async (chatId: string) => {
        if (!userId) throw new Error('User not authenticated');

        try {
            // First delete all messages (should happen automatically with ON DELETE CASCADE)
            const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('chat_id', chatId);

            if (messagesError) {
                console.warn('Failed to delete messages:', messagesError);
            }

            // Then delete the chat
            const { error: chatError } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId)
                .eq('user_id', userId);

            if (chatError) {
                throw chatError;
            }

            return true;
        } catch (error) {
            console.error('Error deleting chat:', error);
            return false;
        }
    }, [userId]);

    return {
        createUserProfile,
        createNewChat,
        addMessageToChat,
        getChat,
        getUserChats,
        subscribeToChats,
        archiveChat,
        renameChat,
        markChatAsRead,
        deleteChat
    };
};