import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import type { Message } from '../../../types/chat.types';

const BASE_MESSAGE: Message = {
  _id: 'msg1',
  group: 'group1',
  sender: {
    _id: 'user1',
    name: 'Alice',
    email: 'alice@test.com',
    avatar: null,
    coverImage: null,
    createdAt: '',
  },
  content: 'Hello world',
  type: 'text',
  readBy: [],
  reactions: [],
  pinned: false,
  createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
};

describe('MessageBubble', () => {
  it('renders message content', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={false} />);
    expect(screen.getByText('Hello world')).toBeOnTheScreen();
  });

  it('shows sender name for other messages', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={false} />);
    expect(screen.getByText('Alice')).toBeOnTheScreen();
  });

  it('hides sender name for own messages', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={true} />);
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('shows avatar initial when no avatar url', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={false} />);
    expect(screen.getByText('A')).toBeOnTheScreen();
  });

  it('hides avatar for own messages', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={true} />);
    expect(screen.queryByText('A')).toBeNull();
  });

  it('renders system message as centered text, no sender name', () => {
    const sysMsg: Message = {
      ...BASE_MESSAGE,
      type: 'system',
      content: 'Alice joined the trip',
    };
    render(<MessageBubble message={sysMsg} isOwn={false} />);
    expect(screen.getByText('Alice joined the trip')).toBeOnTheScreen();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('formats timestamp from ISO string', () => {
    render(<MessageBubble message={BASE_MESSAGE} isOwn={false} />);
    // Timestamp text is rendered — just assert it exists (locale-dependent value)
    const timeTexts = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeTexts.length).toBeGreaterThan(0);
  });
});
