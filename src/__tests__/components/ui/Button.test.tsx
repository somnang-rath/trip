import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';

describe('Button', () => {
  it('renders the title text', () => {
    render(<Button title="Save" />);
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('invokes onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and hides the title while loading', () => {
    const { UNSAFE_queryByType } = render(<Button title="Save" loading />);
    expect(UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <Button title="Save" loading onPress={onPress} />,
    );
    const indicator = UNSAFE_getByType(ActivityIndicator);
    // The TouchableOpacity is the closest pressable ancestor
    fireEvent.press(indicator.parent!);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Save" disabled onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
