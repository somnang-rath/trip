import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MessageInput } from '../../../components/chat/MessageInput';

describe('MessageInput', () => {
  const onSend = jest.fn();
  const onEdit = jest.fn();
  const onTypingStart = jest.fn();
  const onTypingStop = jest.fn();

  function setup() {
    return render(
      <MessageInput
        onSend={onSend}
        onEdit={onEdit}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders placeholder text', () => {
    setup();
    expect(screen.getByPlaceholderText('Message...')).toBeOnTheScreen();
  });

  it('does not call onSend when input is empty', () => {
    setup();
    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not call onSend for whitespace-only input', () => {
    setup();
    fireEvent.changeText(screen.getByPlaceholderText('Message...'), '   ');
    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onSend with trimmed content and clears the input', () => {
    setup();
    const input = screen.getByPlaceholderText('Message...');
    fireEvent.changeText(input, '  Hello!  ');
    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSend).toHaveBeenCalledWith({
      content: 'Hello!',
      media: null,
      replyTo: null,
    });
    expect(input.props.value).toBe('');
  });

  it('calls onTypingStart on first character', () => {
    setup();
    fireEvent.changeText(screen.getByPlaceholderText('Message...'), 'h');
    expect(onTypingStart).toHaveBeenCalledTimes(1);
  });

  it('does not call onTypingStart again while already typing', () => {
    setup();
    const input = screen.getByPlaceholderText('Message...');
    fireEvent.changeText(input, 'h');
    fireEvent.changeText(input, 'he');
    fireEvent.changeText(input, 'hel');
    expect(onTypingStart).toHaveBeenCalledTimes(1);
  });
});
