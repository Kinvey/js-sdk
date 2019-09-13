import { init } from '../init';
import {
  getAppKey,
  getAppSecret,
  getInstanceId,
  getDefaultTimeout,
  getEncryptionKey,
  getApiVersion,
  getMasterSecret,
} from '../kinvey';

describe('init()', () => {
  const appKey = 'appKey';
  const appSecret = 'appSecret';

  it('should throw an error that an appKey is not provided', () => {
    // @ts-ignore
    expect(() => init({ appSecret })).toThrow(
      new Error('No app key was provided to initialize the Kinvey JavaScript SDK.')
    );
  });

  it('should throw an error that an appSecret is not provided', () => {
    // @ts-ignore
    expect(() => init({ appKey })).toThrow(
      new Error('No app secret was provided to initialize the Kinvey JavaScript SDK.')
    );
  });

  it('should set the appKey and appSecret', () => {
    init({ appKey, appSecret });
    expect(getAppKey()).toEqual(appKey);
    expect(getAppSecret()).toEqual(appSecret);
  });

  it('should set the masterSecret', () => {
    const masterSecret = 'masterSecret';
    init({ appKey, appSecret, masterSecret });
    expect(getMasterSecret()).toEqual(masterSecret);
  });

  it('should set the instanceId', () => {
    const instanceId = 'instanceId';
    init({ appKey, appSecret, instanceId });
    expect(getInstanceId()).toEqual(instanceId);
  });

  it('should set the defaultTimeout', () => {
    const defaultTimeout = 10;
    init({ appKey, appSecret, defaultTimeout });
    expect(getDefaultTimeout()).toEqual(defaultTimeout);
  });

  it('should set the encryptionKey', () => {
    const encryptionKey = 'encryptionKey';
    init({ appKey, appSecret, encryptionKey });
    expect(getEncryptionKey()).toEqual(encryptionKey);
  });

  it('should set the apiVersion', () => {
    const apiVersion = 1;
    init({ appKey, appSecret, apiVersion });
    expect(getApiVersion()).toEqual(apiVersion);
  });
});
