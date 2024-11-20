import { AppShell } from '@mantine/core';
import React, { useEffect, useRef, useState } from 'react';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { notifications } from '@mantine/notifications';
import { useConversation } from '@11labs/react';

// Components
import { ChatSection } from '../components/ChatSection/ChatSection.js';
import { Header } from '../components/Header/Header.js';
import { AuthOverlay } from '../components/AuthOverlay/AuthOverlay.js';

// Types
import { EnhancedConversationItem } from '../types/conversation';

export const Home: React.FC = () => {
  // State
  const [selectedMode, setSelectedMode] = useState('tutor');
  const [messages, setMessages] = useState<EnhancedConversationItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Initialize Eleven Labs conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to Eleven Labs');
      notifications.show({
        title: 'Connected',
        message: 'Successfully connected to language tutor',
        color: 'green',
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from Eleven Labs');
      setIsRecording(false);
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
      const enhancedMessage: EnhancedConversationItem = {
        id: Date.now().toString(),
        object: 'conversation.message',
        role: props.source === 'ai' ? 'assistant' : 'user',
        type: 'message',
        content: props.message,
        formatted: {
          text: props.message,
        },
        created_at: new Date().toISOString(),
        timestamp: Date.now(),
        status: 'completed'
      };
      setMessages(prev => [...prev, enhancedMessage]);
    },
  });

  const { status, isSpeaking } = conversation;

  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);

  // Request microphone access on mount
  useEffect(() => {
    const requestMicrophoneAccess = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        notifications.show({
          title: 'Microphone Access Required',
          message: 'Please allow microphone access to use the language tutor.',
          color: 'red',
        });
      }
    };

    requestMicrophoneAccess();
  }, []);

  const getSignedUrl = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ELEVEN_SERVER_URL}/api/get-signed-url`);
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      const data = await response.json();
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  };

  const handleStartRecording = async () => {
    try {
      const signedUrl = await getSignedUrl();
      
      await conversation.startSession({
        signedUrl,
        origin: window.location.origin,
        authorization: import.meta.env.VITE_ELEVEN_LABS_API_KEY
      });
      
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      notifications.show({
        title: 'Recording Error',
        message: 'Failed to start recording. Please try again.',
        color: 'red',
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      await conversation.endSession();
      setIsRecording(false);
    } catch (error) {
      console.error('Stop recording error:', error);
      notifications.show({
        title: 'Recording Error',
        message: 'Failed to stop recording. Please try again.',
        color: 'red',
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    const enhancedMessage: EnhancedConversationItem = {
      id: Date.now().toString(),
      object: 'conversation.message',
      role: 'user',
      type: 'message',
      content: message,
      formatted: {
        text: message,
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      status: 'completed'
    };
    setMessages(prev => [...prev, enhancedMessage]);
  };

  // Handle API key reset (required for Header component)
  const handleResetAPIKey = () => {
    notifications.show({
      title: 'Info',
      message: 'API key management is handled through environment variables.',
      color: 'blue',
    });
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
      style={{ 
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Header
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        onResetAPIKey={handleResetAPIKey}
        showSettings={false}
      />

      <AppShell.Main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%' }}>
        <SignedIn>
          <ChatSection
            items={messages}
            isConnected={status === 'connected'}
            isRecording={isRecording || isSpeaking}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onDisconnect={handleStopRecording}
            onConnect={handleStartRecording}
            onSendMessage={handleSendMessage}
            clientCanvasRef={clientCanvasRef}
            serverCanvasRef={serverCanvasRef}
          />
        </SignedIn>
        <SignedOut>
          <AuthOverlay />
        </SignedOut>
      </AppShell.Main>
    </AppShell>
  );
};

export default Home;
