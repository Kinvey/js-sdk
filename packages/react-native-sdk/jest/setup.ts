import MockAsyncStorage from 'mock-async-storage';

jest.mock('@react-native-community/async-storage', () => new MockAsyncStorage());
