import { useCallback, useState } from 'react';
import { useConversation as useElevenLabsConversation } from '@11labs/react';
import { notifications } from '@mantine/notifications';

interface ConversationState {
  messages: any[];
  isConnected: boolean;
  isLoading: boolean;
}

export const useConversation = () => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isConnected: false,
    isLoading: false,
  });

  const elevenLabs = useElevenLabsConversation({
    onConnect: () => {
      setState(prev => ({ ...prev, isConnected: true }));
      notifications.show({
        title: 'Connected',
        message: 'Successfully connected to language tutor',
        color: 'green',
      });
    },
    onDisconnect: () => {
      setState(prev => ({ ...prev, isConnected: false }));
      notifications.show({
        title: 'Disconnected',
        message: 'Connection to language tutor ended',
        color: 'yellow',
      });
    },
    onError: (message: string) => {
      console.error('Conversation error:', message);
      notifications.show({
        title: 'Error',
        message: 'Failed to process conversation. Please try again.',
        color: 'red',
      });
    },
    onMessage: (props: { message: string; source: string }) => {
      const newMessage = {
        id: Date.now().toString(),
        role: props.source === 'ai' ? 'assistant' : 'user',
        content: props.message,
        timestamp: Date.now(),
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await fetch(`${import.meta.env.VITE_ELEVEN_SERVER_URL}/api/get-signed-url`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      const data = await response.json();
      
      await elevenLabs.startSession({
        signedUrl: data.signedUrl,
        origin: window.location.origin,
        authorization: import.meta.env.VITE_ELEVEN_LABS_API_KEY
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      notifications.show({
        title: 'Connection Error',
        message: 'Failed to start conversation. Please try again.',
        color: 'red',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [elevenLabs]);

  const endConversation = useCallback(async () => {
    try {
      await elevenLabs.endSession();
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [elevenLabs]);

  return {
    ...state,
    startConversation,
    endConversation,
    isSpeaking: elevenLabs.isSpeaking,
  };
};
