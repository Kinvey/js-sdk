import { setInstanceId, removeInstanceId, setAppKey } from '../../kinvey';
import {
  clean,
  getBaasProtocol,
  getBaasHost,
  getAuthProtocol,
  getAuthHost,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
} from '../utils';

describe('clean()', () => {
  it('should remove properties set to null or undefined', () => {
    const obj = {
      prop1: 'string',
      prop2: 1,
      prop3: false,
      prop4: true,
      prop5: {},
      prop6: [],
      prop7: undefined,
      prop8: null,
    };
    expect(clean(obj)).toEqual({
      prop1: 'string',
      prop2: 1,
      prop3: false,
      prop4: true,
      prop5: {},
      prop6: [],
    });
  });

  it('should remove deep properties set to null or undefiend', () => {
    const obj = {
      prop1: 'string',
      prop2: 1,
      prop3: false,
      prop4: true,
      prop5: {},
      prop6: [],
      prop7: {
        prop1: 'string',
        prop2: 1,
        prop3: false,
        prop4: true,
        prop5: {},
        prop6: [],
        prop7: undefined,
        prop8: null,
      },
      prop8: undefined,
      prop9: null,
    };
    expect(clean(obj)).toEqual({
      prop1: 'string',
      prop2: 1,
      prop3: false,
      prop4: true,
      prop5: {},
      prop6: [],
      prop7: {
        prop1: 'string',
        prop2: 1,
        prop3: false,
        prop4: true,
        prop5: {},
        prop6: [],
      },
    });
  });
});

describe('getBaasProtocol()', () => {
  it('should return https:', () => {
    expect(getBaasProtocol()).toEqual('https:');
  });
});

describe('getBaasHost()', () => {
  it('should return baas.kinvey.com', () => {
    expect(getBaasHost()).toEqual('baas.kinvey.com');
  });

  it('should return <instanceId>-baas.kinvey.com', () => {
    const instanceId = 'instanceId';
    setInstanceId(instanceId);
    expect(getBaasHost()).toEqual(`${instanceId}-baas.kinvey.com`);
    removeInstanceId();
  });
});

describe('getAuthProtocol()', () => {
  it('should return https:', () => {
    expect(getAuthProtocol()).toEqual('https:');
  });
});

describe('getAuthHost()', () => {
  it('should return auth.kinvey.com', () => {
    expect(getAuthHost()).toEqual('auth.kinvey.com');
  });

  it('should return <instanceId>-auth.kinvey.com', () => {
    const instanceId = 'instanceId';
    setInstanceId(instanceId);
    expect(getAuthHost()).toEqual(`${instanceId}-auth.kinvey.com`);
    removeInstanceId();
  });
});

describe('formatKinveyBaasUrl()', () => {
  const appKey = 'appKey';

  beforeAll(() => setAppKey(appKey));

  it('should return a formatted url with the namespace set to appdata by default', () => {
    expect(formatKinveyBaasUrl()).toEqual(`https://baas.kinvey.com/appdata/${appKey}`);
  });

  it('should return a formatted url with the namespace set to appdata', () => {
    expect(formatKinveyBaasUrl(KinveyBaasNamespace.AppData)).toEqual(`https://baas.kinvey.com/appdata/${appKey}`);
  });

  it('should return a formatted url with the namespace set to blob', () => {
    expect(formatKinveyBaasUrl(KinveyBaasNamespace.Blob)).toEqual(`https://baas.kinvey.com/blob/${appKey}`);
  });

  it('should return a formatted url with the namespace set to push', () => {
    expect(formatKinveyBaasUrl(KinveyBaasNamespace.Push)).toEqual(`https://baas.kinvey.com/push/${appKey}`);
  });

  it('should return a formatted url with the namespace set to rpc', () => {
    expect(formatKinveyBaasUrl(KinveyBaasNamespace.Rpc)).toEqual(`https://baas.kinvey.com/rpc/${appKey}`);
  });

  it('should return a formatted url with the namespace set to user', () => {
    expect(formatKinveyBaasUrl(KinveyBaasNamespace.User)).toEqual(`https://baas.kinvey.com/user/${appKey}`);
  });

  it('should throw an error if path is not a string', () => {
    const path = 3;
    // @ts-ignore
    expect(() => formatKinveyBaasUrl({ path })).toThrow();
  });

  it('should return a formatted url with the provided path', () => {
    const path = 'path';
    expect(formatKinveyBaasUrl(undefined, path)).toEqual(`https://baas.kinvey.com/appdata/${appKey}/${path}`);
  });

  it('should sanitize the provided query and return a formatted url', () => {
    const query = { foo: 'bar', undefinedProp: undefined, nullProp: null, num: 1 };
    expect(formatKinveyBaasUrl(undefined, undefined, query)).toEqual(
      `https://baas.kinvey.com/appdata/${appKey}?foo=bar&num=1`
    );
  });
});
