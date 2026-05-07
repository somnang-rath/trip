import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Image } from 'react-native';
import { Avatar } from '../../../components/ui/Avatar';

describe('Avatar', () => {
  it('renders initials from a two-word name', () => {
    render(<Avatar name="Alice Cooper" />);
    expect(screen.getByText('AC')).toBeOnTheScreen();
  });

  it('renders a single initial for a single-word name', () => {
    render(<Avatar name="Bob" />);
    expect(screen.getByText('B')).toBeOnTheScreen();
  });

  it('only uses the first two words for initials', () => {
    render(<Avatar name="Mary Jane Watson" />);
    expect(screen.getByText('MJ')).toBeOnTheScreen();
  });

  it('uppercases the initials', () => {
    render(<Avatar name="alice cooper" />);
    expect(screen.getByText('AC')).toBeOnTheScreen();
  });

  it('renders an Image when a uri is provided and skips initials', () => {
    const { UNSAFE_getByType } = render(
      <Avatar name="Alice Cooper" uri="https://example.com/a.png" />,
    );
    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({ uri: 'https://example.com/a.png' });
    expect(screen.queryByText('AC')).toBeNull();
  });

  it('falls back to initials when uri is null', () => {
    render(<Avatar name="Alice Cooper" uri={null} />);
    expect(screen.getByText('AC')).toBeOnTheScreen();
  });

  it('applies the given size to the circle dimensions', () => {
    const { UNSAFE_getByType } = render(
      <Avatar name="Alice" uri="https://example.com/a.png" size={64} />,
    );
    const img = UNSAFE_getByType(Image);
    const flatStyle = Array.isArray(img.props.style)
      ? Object.assign({}, ...img.props.style)
      : img.props.style;
    expect(flatStyle.width).toBe(64);
    expect(flatStyle.height).toBe(64);
    expect(flatStyle.borderRadius).toBe(32);
  });
});
