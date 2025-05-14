import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../__mocks__/mockModules';
import MessageBubble from '../../../src/components/ChatSection/MessageBubble';
import { EnhancedConversationItem } from '../../../src/types/conversation';


jest.mock('../../../src/contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      settings: {
        displayMode: 'standard',
        useGlassUI: false
      }
    }
  })
}));

describe('MessageBubble Component', () => {
  it('renders user message correctly', () => {
    const message: EnhancedConversationItem = {
      id: '1',
      object: 'chat.completion.chunk',
      role: 'user',
      type: 'message',
      content: 'Hello world',
      formatted: {
        text: 'Hello world',
        transcript: 'Hello world'
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    render(<MessageBubble item={message} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const message: EnhancedConversationItem = {
      id: '2',
      object: 'chat.completion.chunk',
      role: 'assistant',
      type: 'message',
      content: 'Hello, I am a bot',
      formatted: {
        text: 'Hello, I am a bot'
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    render(<MessageBubble item={message} />);

    expect(screen.getByText('Hello, I am a bot')).toBeInTheDocument();
  });

  it('applies the correct class based on the role', () => {
    const userMessage: EnhancedConversationItem = {
      id: '3',
      object: 'chat.completion.chunk',
      role: 'user',
      type: 'message',
      content: 'User message',
      formatted: {
        text: 'User message',
        transcript: 'User message'
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    const { rerender } = render(<MessageBubble item={userMessage} />);


    const userContainer = screen.getByText('User message').closest('div');
    expect(userContainer).toHaveClass('userMessage');

    const botMessage: EnhancedConversationItem = {
      id: '4',
      object: 'chat.completion.chunk',
      role: 'assistant',
      type: 'message',
      content: 'Bot message',
      formatted: {
        text: 'Bot message'
      },
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    rerender(<MessageBubble item={botMessage} />);

    const botContainer = screen.getByText('Bot message').closest('div');
    expect(botContainer).toHaveClass('botMessage');
  });
}); 