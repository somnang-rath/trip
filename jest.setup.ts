import '@testing-library/react-native/matchers';

// react-native-reanimated — use the official mock so tests don't need native builds
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// expo-secure-store — no native module in Jest
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// expo-location — no native module in Jest
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  watchPositionAsync: jest.fn().mockReturnValue({ remove: jest.fn() }),
  Accuracy: { Balanced: 3 },
}));

// expo-video — native module, swap with a noop component + hook for tests
jest.mock('expo-video', () => {
  const React = require('react');
  return {
    useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn(), loop: false }),
    VideoView: (props: { children?: React.ReactNode }) =>
      React.createElement('VideoView', null, props.children),
  };
});

// expo-video-thumbnails — used only for chat video thumbnails
jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn().mockResolvedValue({ uri: 'mock://thumb.jpg' }),
}));

// expo-image-manipulator — exercise the same import path without native deps
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'mock://image.jpg',
    width: 100,
    height: 100,
    base64: 'mockbase64',
  }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// expo-clipboard — used by chat actions, no native module in Jest
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

// expo-image-picker — never opens the OS picker in tests; resolve canceled.
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest
    .fn()
    .mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest
    .fn()
    .mockResolvedValue({ canceled: true, assets: [] }),
}));
