import MockAsyncStorage from 'mock-async-storage';

jest.mock('@react-native-community/async-storage', () => new MockAsyncStorage());

jest.mock('PushNotificationIOS', () => {
  return {
    addEventListener: jest.fn(),
    requestPermissions: jest.fn(() => Promise.resolve()),
    getInitialNotification: jest.fn(() => Promise.resolve())
  };
});
