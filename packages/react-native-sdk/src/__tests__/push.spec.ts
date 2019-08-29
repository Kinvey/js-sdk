import isFunction from 'lodash/isFunction';
import { resolve } from 'path';

const DEVICE_TOKEN = { os: 'MacOs', token: 'token' };
const PUSH_NOTIFICATION = {
  foregroup: false,
  userInteraction: false,
  message: 'Hello World!',
  data: { title: 'Test Push Notification' },
  badge: 0,
  alert: { title: 'Test Push Notification' },
  sound: 'alert.wav',
  finish: jest.fn()
};
const PushNotificationMock = {
  configure: jest.fn((options = {}) => {
    const { onRegister, onNotification } = options;

    if (isFunction(onRegister)) {
      onRegister(DEVICE_TOKEN);
    }

    if (isFunction(onNotification)) {
      onNotification(PUSH_NOTIFICATION);
    }
  }),
  unregister: jest.fn()
};
jest.mock('react-native-push-notification', () => PushNotificationMock);

const KinveyHttpMock = {
  formatKinveyBaasUrl: jest.fn((namespace, path) => resolve('https://baas.kinvey.com/', namespace, path)),
  KinveyHttpRequest: jest.fn().mockImplementation(() => {
    return {
      execute: jest.fn(() => Promise.resolve())
    };
  }),
  HttpRequestMethod: {
    POST: 'post'
  },
  KinveyHttpAuth: {
    Session: 'session'
  },
  KinveyBaasNamespace: {
    Push: 'push'
  }
};
jest.mock('kinvey-js-sdk/lib/http', () => KinveyHttpMock);

import { register, unregister } from '../push';

describe('register()', () => {
  test('should register the device with Kinvey', async () => {
    await register();
    expect(KinveyHttpMock.KinveyHttpRequest).toBeCalledWith({
      method: 'post',
      auth: 'session',
      url: '/register-device',
      body: {
        platform: 'macos',
        framework: 'react-native',
        deviceId: 'token',
        service: 'firebase'
      }
    });
  });

  test('should return device token', async () => {
    const token = await register();
    expect(token).toEqual(DEVICE_TOKEN.token);
  });

  test('should call onRegister callback', async () => {
    const onRegister = jest.fn();
    await register({ onRegister });
    expect(onRegister).toBeCalledWith(DEVICE_TOKEN);
  });

  test('should call onNotification callback', async () => {
    const onNotification = jest.fn();
    await register({ onNotification });
    expect(onNotification).toBeCalledWith(PUSH_NOTIFICATION);
  });
});

describe('unregister()', () => {
  test('should unregister the device with Kinvey', async () => {
    await unregister();
    expect(KinveyHttpMock.KinveyHttpRequest).toBeCalledWith({
      method: 'post',
      auth: 'session',
      url: '/unregister-device',
      body: {
        platform: 'macos',
        framework: 'react-native',
        deviceId: 'token',
        service: 'firebase'
      }
    });
  });

  test('should unregister react native push notification module', async () => {
    await unregister();
    expect(PushNotificationMock.unregister).toBeCalled();
  });
});
