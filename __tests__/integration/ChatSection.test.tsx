import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedChatSection from '../../src/components/ChatSection/EnhancedChatSection';
import { ConnectionState } from '../../src/types/connection';
import { EnhancedConversationItem } from '../../src/types/conversation';


jest.mock('../../src/contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      settings: {
        displayMode: 'standard',
        useGlassUI: false,
        voiceEnabled: true,
      },
      conversations: []
    },
    updateProfile: jest.fn()
  })
}));

jest.mock('../../src/services/FirebaseChatService', () => ({
  useFirebaseChat: () => ({
    sendMessage: jest.fn().mockResolvedValue(undefined),
    loadConversation: jest.fn().mockResolvedValue({ messages: [] }),
    isLoading: false,
    error: null
  })
}));

jest.mock('../../src/services/AudioService', () => ({
  useAudioService: () => ({
    startRecording: jest.fn().mockResolvedValue(undefined),
    stopRecording: jest.fn().mockResolvedValue(undefined),
    isRecording: false,
    isProcessing: false,
    audioLevel: 0,
    serverAudioLevel: 0,
    cleanup: jest.fn()
  })
}));


jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ conversationId: 'test-conversation-id' })
}));


jest.mock('@clerk/clerk-react', () => {
  return {
    useUser: () => ({
      user: {
        firstName: 'Test User',
        id: 'test-user-id',
        primaryEmailAddress: { emailAddress: 'test@example.com' }
      },
      isLoaded: true,
      isSignedIn: true
    }),
    SignedIn: ({ children }) => {
      return React.createElement(React.Fragment, null, children);
    },
    SignedOut: () => null
  };
});

describe('EnhancedChatSection Integration', () => {
  const defaultProps = {
    connectionState: ConnectionState.CONNECTED,
    isThinking: false,
    isRecording: false,
    isSpeaking: false,
    audioLevel: 0,
    connectionError: null,
    onStartRecording: jest.fn().mockResolvedValue(undefined),
    onStopRecording: jest.fn().mockResolvedValue(undefined),
    onDisconnect: jest.fn().mockResolvedValue(undefined),
    onConnect: jest.fn().mockResolvedValue(undefined),
    onSendMessage: jest.fn().mockResolvedValue(undefined),
    messages: [] as EnhancedConversationItem[],
    conversationId: 'test-conversation-id',
    onSelectChat: jest.fn(),
    onCloseChat: jest.fn(),
    onNewChat: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat section with empty message state', async () => {
    render(<EnhancedChatSection {...defaultProps} />);


    expect(screen.getByPlaceholderText(/Type or speak your message.../i)).toBeInTheDocument();
  });

  it('allows user to send message via text input', async () => {
    const onSendMessage = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByRole } = render(
      <EnhancedChatSection {...defaultProps} onSendMessage={onSendMessage} />
    );


    const inputField = getByPlaceholderText(/Type or speak your message.../i);
    fireEvent.change(inputField, { target: { value: 'Hello world' } });


    const sendButton = getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);


    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Hello world');
    });


    await waitFor(() => {
      expect(inputField).toHaveValue('');
    });
  });

  it('displays messages correctly', async () => {
    const messages: EnhancedConversationItem[] = [
      {
        id: '1',
        object: 'chat.completion.chunk',
        role: 'user',
        type: 'message',
        content: 'Hello',
        formatted: {
          text: 'Hello',
          transcript: 'Hello'
        },
        created_at: new Date().toISOString(),
        timestamp: Date.now()
      },
      {
        id: '2',
        object: 'chat.completion.chunk',
        role: 'assistant',
        type: 'message',
        content: 'Hi there!',
        formatted: {
          text: 'Hi there!'
        },
        created_at: new Date().toISOString(),
        timestamp: Date.now()
      }
    ];

    render(<EnhancedChatSection {...defaultProps} messages={messages} />);


    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('handles speech-to-text input when voice button is clicked', async () => {
    const onStartRecording = jest.fn().mockResolvedValue(undefined);
    const onStopRecording = jest.fn().mockResolvedValue(undefined);

    const { getByRole } = render(
      <EnhancedChatSection
        {...defaultProps}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
      />
    );


    const voiceButton = getByRole('button', { name: /start recording/i });
    fireEvent.click(voiceButton);


    await waitFor(() => {
      expect(onStartRecording).toHaveBeenCalled();
    });


    const { getByRole: getRecordingEl } = render(
      <EnhancedChatSection
        {...defaultProps}
        isRecording={true}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
      />
    );


    const stopButton = getRecordingEl('button', { name: /stop recording/i });
    fireEvent.click(stopButton);


    await waitFor(() => {
      expect(onStopRecording).toHaveBeenCalled();
    });
  });
}); 