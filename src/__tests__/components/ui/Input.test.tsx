import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from '../../../components/ui/Input';

describe('Input', () => {
  it('renders the label when provided', () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    expect(screen.getByText('Email')).toBeOnTheScreen();
  });

  it('omits the label when not provided', () => {
    render(<Input placeholder="you@example.com" />);
    // Only the placeholder should match — no label text
    expect(screen.queryByText('Email')).toBeNull();
  });

  it('renders the error message when provided', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeOnTheScreen();
  });

  it('omits the error element when no error is given', () => {
    render(<Input label="Email" />);
    expect(screen.queryByText('Required')).toBeNull();
  });

  it('forwards changes via onChangeText', () => {
    const onChangeText = jest.fn();
    render(<Input placeholder="you@example.com" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.co');
    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
  });

  it('forwards the value prop to the TextInput', () => {
    render(<Input placeholder="you@example.com" value="hello" onChangeText={() => {}} />);
    expect(screen.getByPlaceholderText('you@example.com').props.value).toBe('hello');
  });
});
