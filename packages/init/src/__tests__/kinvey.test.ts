import {
  getAppKey,
  setAppKey,
  setAppSecret,
  getAppSecret,
  setMasterSecret,
  getMasterSecret,
  getInstanceId,
  setInstanceId,
  getDefaultTimeout,
  setDefaultTimeout,
  getEncryptionKey,
  setEncryptionKey,
  getApiVersion,
  setApiVersion,
  removeInstanceId,
} from '../kinvey';

describe('getAppKey()', () => {
  it('should throw an error that the appKey has not been set', () => {
    expect(() => getAppKey()).toThrow(new Error('An appKey has not been set. Please initialize the SDK.'));
  });
});

describe('setAppKey()', () => {
  it('should throw an error if the appKey is not a string', () => {
    // @ts-ignore
    expect(() => setAppKey({})).toThrow(new Error('The appKey must be a string.'));
    // @ts-ignore
    expect(() => setAppKey(4)).toThrow(new Error('The appKey must be a string.'));
    // @ts-ignore
    expect(() => setAppKey(true)).toThrow(new Error('The appKey must be a string.'));
    // @ts-ignore
    expect(() => setAppKey([])).toThrow(new Error('The appKey must be a string.'));
  });

  it('should set the appKey', () => {
    const appKey = 'appKey';
    setAppKey(appKey);
    expect(getAppKey()).toEqual(appKey);
  });
});

describe('getAppSecret()', () => {
  it('should throw an error that the appSecret has not been set', () => {
    expect(() => getAppSecret()).toThrow(new Error('An appSecret has not been set. Please initialize the SDK.'));
  });
});

describe('setAppSecret()', () => {
  it('should throw an error if the appSecret is not a string', () => {
    // @ts-ignore
    expect(() => setAppSecret({})).toThrow(new Error('The appSecret must be a string.'));
    // @ts-ignore
    expect(() => setAppSecret(4)).toThrow(new Error('The appSecret must be a string.'));
    // @ts-ignore
    expect(() => setAppSecret(true)).toThrow(new Error('The appSecret must be a string.'));
    // @ts-ignore
    expect(() => setAppSecret([])).toThrow(new Error('The appSecret must be a string.'));
  });

  it('should set the appSecret', () => {
    const appSecret = 'appSecret';
    setAppSecret(appSecret);
    expect(getAppSecret()).toEqual(appSecret);
  });
});

describe('getMasterSecret()', () => {
  it('should throw an error that the masterSecret has not been set', () => {
    expect(() => getMasterSecret()).toThrow(new Error('An masterSecret has not been set.'));
  });
});

describe('setMasterSecret()', () => {
  it('should throw an error if the masterSecret is not a string', () => {
    // @ts-ignore
    expect(() => setMasterSecret({})).toThrow(new Error('The masterSecret must be a string.'));
    // @ts-ignore
    expect(() => setMasterSecret(4)).toThrow(new Error('The masterSecret must be a string.'));
    // @ts-ignore
    expect(() => setMasterSecret(true)).toThrow(new Error('The masterSecret must be a string.'));
    // @ts-ignore
    expect(() => setMasterSecret([])).toThrow(new Error('The masterSecret must be a string.'));
  });

  it('should set the masterSecret', () => {
    const masterSecret = 'masterSecret';
    setMasterSecret(masterSecret);
    expect(getMasterSecret()).toEqual(masterSecret);
  });
});

describe('getInstanceId()', () => {
  it('should return undefined if an instanceId is not set', () => {
    expect(getInstanceId()).toBe(undefined);
  });
});

describe('setInstanceId()', () => {
  it('should throw and error if the instanceId is not a string', () => {
    // @ts-ignore
    expect(() => setInstanceId({})).toThrow(new Error('The instanceId must be a string.'));
    // @ts-ignore
    expect(() => setInstanceId(4)).toThrow(new Error('The instanceId must be a string.'));
    // @ts-ignore
    expect(() => setInstanceId(true)).toThrow(new Error('The instanceId must be a string.'));
    // @ts-ignore
    expect(() => setInstanceId([])).toThrow(new Error('The instanceId must be a string.'));
  });

  it('should set the instanceId', () => {
    const instanceId = 'instanceId';
    setInstanceId(instanceId);
    expect(getInstanceId()).toEqual(instanceId);
  });
});

describe('removeInstanceId()', () => {
  it('should set the instanceId to undefined', () => {
    const instanceId = 'instanceId';
    setInstanceId(instanceId);
    removeInstanceId();
    expect(getInstanceId()).toBe(undefined);
  });
});

describe('getDefaultTimeout()', () => {
  it('should return the defaultTimeout if a defaultTimeout is not set', () => {
    expect(getDefaultTimeout()).toEqual(60000);
  });
});

describe('setDefaultTimeout()', () => {
  it('should throw and error if the defaultTimeout is not a string', () => {
    // @ts-ignore
    expect(() => setDefaultTimeout({})).toThrow(
      new Error('The default timeout must be a number and should be expressed in ms.')
    );
    // @ts-ignore
    expect(() => setDefaultTimeout('4')).toThrow(
      new Error('The default timeout must be a number and should be expressed in ms.')
    );
    // @ts-ignore
    expect(() => setDefaultTimeout(true)).toThrow(
      new Error('The default timeout must be a number and should be expressed in ms.')
    );
    // @ts-ignore
    expect(() => setDefaultTimeout([])).toThrow(
      new Error('The default timeout must be a number and should be expressed in ms.')
    );
  });

  it('should set the defaultTimeout', () => {
    const defaultTimeout = 10;
    setDefaultTimeout(defaultTimeout);
    expect(getDefaultTimeout()).toEqual(defaultTimeout);
  });
});

describe('getEncryptionKey()', () => {
  it('should return undefined if an encryptionKey is not set', () => {
    expect(getEncryptionKey()).toBe(undefined);
  });
});

describe('setEncryptionKey()', () => {
  it('should throw and error if the encryptionKey is not a string', () => {
    // @ts-ignore
    expect(() => setEncryptionKey({})).toThrow(new Error('The encryptionKey must be a string.'));
    // @ts-ignore
    expect(() => setEncryptionKey(4)).toThrow(new Error('The encryptionKey must be a string.'));
    // @ts-ignore
    expect(() => setEncryptionKey(true)).toThrow(new Error('The encryptionKey must be a string.'));
    // @ts-ignore
    expect(() => setEncryptionKey([])).toThrow(new Error('The encryptionKey must be a string.'));
  });

  it('should set the encryptionKey', () => {
    const encryptionKey = 'encryptionKey';
    setEncryptionKey(encryptionKey);
    expect(getEncryptionKey()).toEqual(encryptionKey);
  });
});

describe('getApiVersion()', () => {
  it('should return the default api version', () => {
    expect(getApiVersion()).toEqual(4);
  });
});

describe('setApiVersion()', () => {
  it('should throw and error if the apiVersion is not a string', () => {
    // @ts-ignore
    expect(() => setApiVersion({})).toThrow(new Error('The api version must be a number.'));
    // @ts-ignore
    expect(() => setApiVersion('4')).toThrow(new Error('The api version must be a number.'));
    // @ts-ignore
    expect(() => setApiVersion(true)).toThrow(new Error('The api version must be a number.'));
    // @ts-ignore
    expect(() => setApiVersion([])).toThrow(new Error('The api version must be a number.'));
  });

  it('should set the apiVersion', () => {
    const apiVersion = 10;
    setApiVersion(apiVersion);
    expect(getApiVersion()).toEqual(apiVersion);
  });
});
