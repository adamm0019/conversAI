import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { Home } from '../../../src/pages/Home';
import { ConnectionState } from '../../../src/types/connection';
import { useWebSocketConversation } from '../../../src/hooks/useWebSocketConversation';
import { useProfile } from '../../../src/contexts/ProfileContext';
import { useAzurePronunciation } from '../../../src/services/AzurePronunciationService';
import { notifications } from '@mantine/notifications';

jest.mock('@clerk/clerk-react', () => ({
  useUser: jest.fn(),
}));

const mockStartConversation = jest.fn();
const mockEndConversation = jest.fn();
const mockSendMessage = jest.fn();
const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockGetInputAudioLevel = jest.fn(() => 0);
const mockUpdateDynamicVariables = jest.fn();
const mockGetOutputAudioLevel = jest.fn(() => 0);

jest.mock('../hooks/useWebSocketConversation', () => {
  const { ConnectionState } = require('../types/connection');
  return {
    useWebSocketConversation: jest.fn(() => ({
      connectionState: ConnectionState.DISCONNECTED,
      isThinking: false,
      isRecording: false,
      isSpeaking: false,
      error: null,
      messages: [],
      conversationId: null,
      startConversation: mockStartConversation,
      endConversation: mockEndConversation,
      sendMessage: mockSendMessage,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      getInputAudioLevel: mockGetInputAudioLevel,
      getOutputAudioLevel: mockGetOutputAudioLevel,
      updateDynamicVariables: mockUpdateDynamicVariables,
    })),
  };
});

const mockGetDynamicVariables = jest.fn(() => ({ user_name: 'Test User' }));
const mockUpdateProfile = jest.fn();
jest.mock('../contexts/ProfileContext', () => ({
  useProfile: jest.fn(() => ({
    profile: { id: 'profile_123', dynamicVariables: { user_name: 'Test User', target_language: 'en-US', days_streak: 5 } },
    isLoading: false,
    getDynamicVariables: mockGetDynamicVariables,
    updateProfile: mockUpdateProfile,
  })),
}));

const mockAssessPronunciation = jest.fn();
const mockGenerateLanguageFeedback = jest.fn(() => ({ type: 'grammar', message: 'Mock grammar feedback' }));
const mockGenerateAchievementFeedback = jest.fn(() => ({ type: 'streak', message: 'Mock streak feedback' }));
jest.mock('../services/AzurePronunciationService', () => ({
  useAzurePronunciation: jest.fn(() => ({
    assessPronunciation: mockAssessPronunciation,
    generateLanguageFeedback: mockGenerateLanguageFeedback,
    generateAchievementFeedback: mockGenerateAchievementFeedback,
  })),
  FeedbackType: { Grammar: 'grammar', Vocabulary: 'vocabulary' },
}));

const mockShowNotification = jest.fn();
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: mockShowNotification,
  },
}));


jest.mock('../components/ChatSection/EnhancedChatSection', () => {
  return {
    __esModule: true,
    default: function MockChatSection(props: any) {
      const React = require('react');
      return React.createElement(
        'div',
        { 'data-testid': 'mock-chat-section' },
        React.createElement('button', { onClick: props.onConnect }, 'Connect'),
        React.createElement('button', { onClick: props.onDisconnect }, 'Disconnect'),
        React.createElement('button', { onClick: props.onStartRecording }, 'Start Recording'),
        React.createElement('button', { onClick: props.onStopRecording }, 'Stop Recording'),
        React.createElement('button', { onClick: () => props.onSendMessage('Test message') }, 'Send Message'),
        React.createElement('button', { onClick: props.onNewChat }, 'New Chat'),
        props.messages.map((msg: any, index: number) =>
          React.createElement('div', { key: msg.id || index }, msg.content)
        ),
        props.isThinking && React.createElement('span', null, 'Thinking...'),
        props.isRecording && React.createElement('span', null, 'Recording...'),
        props.isSpeaking && React.createElement('span', null, 'Speaking...'),
        React.createElement('span', null, 'Audio Level: ', props.audioLevel),
        props.connectionError && React.createElement('span', null, 'Error: ', props.connectionError)
      );
    }
  };
});

jest.mock('../components/Header/Header', () => {
  return {
    __esModule: true,
    Header: function MockHeader() {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'mock-header' }, 'Mock Header');
    }
  };
});

jest.mock('../components/AuthOverlay/AuthOverlay', () => {
  return {
    __esModule: true,
    AuthOverlay: function MockAuthOverlay() {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'mock-auth-overlay' }, 'Mock Auth Overlay');
    }
  };
});

describe('Home Component', () => {
  const mockedUseWebSocketConversation = useWebSocketConversation as jest.Mock;
  const mockedUseProfile = useProfile as jest.Mock;

  const defaultWebSocketState = {
    connectionState: ConnectionState.DISCONNECTED,
    isThinking: false,
    isRecording: false,
    isSpeaking: false,
    error: null,
    messages: [],
    conversationId: null,
    startConversation: mockStartConversation,
    endConversation: mockEndConversation,
    sendMessage: mockSendMessage,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    getInputAudioLevel: mockGetInputAudioLevel,
    getOutputAudioLevel: mockGetOutputAudioLevel,
    updateDynamicVariables: mockUpdateDynamicVariables,
  };

  const defaultProfileState = {
    profile: { id: 'profile_123', dynamicVariables: { user_name: 'Test User', target_language: 'en-US', days_streak: 5 } },
    isLoading: false,
    getDynamicVariables: mockGetDynamicVariables,
    updateProfile: mockUpdateProfile,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseWebSocketConversation.mockReturnValue(defaultWebSocketState);
    mockedUseProfile.mockReturnValue(defaultProfileState);
  });

  it('renders AuthOverlay when signed out', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-auth-overlay')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-header')).not.toBeInTheDocument();
  });

  it('renders Header and ChatSection when signed in', () => {
    render(<Home />);
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chat-section')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-auth-overlay')).not.toBeInTheDocument();
  });

  it('calls startConversation when Connect button is clicked (if disconnected)', async () => {
    mockedUseWebSocketConversation.mockReturnValue({
      ...defaultWebSocketState,
      connectionState: ConnectionState.DISCONNECTED,
    });
    render(<Home />);
    const connectButton = screen.getByRole('button', { name: /Connect/i });
    fireEvent.click(connectButton);
    await waitFor(() => {
      expect(mockStartConversation).toHaveBeenCalledTimes(1);
    });
  });

  it('renders messages passed to ChatSection', () => {
    const testMessages = [{ id: '1', content: 'Hello', sender: 'user' }, { id: '2', content: 'Hi there', sender: 'ai' }];
    mockedUseWebSocketConversation.mockReturnValue({
      ...defaultWebSocketState,
      connectionState: ConnectionState.CONNECTED,
      messages: testMessages,
    });
    render(<Home />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

});