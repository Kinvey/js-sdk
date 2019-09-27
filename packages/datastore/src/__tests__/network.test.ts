import urlJoin from 'url-join';
import {
  KinveyHttpRequest,
  formatKinveyBaasUrl,
  KinveyNamespace,
  kinveySessionAuth,
} from '@progresskinvey/js-sdk-http';
import { Query } from '@progresskinvey/js-sdk-query';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { setApiVersion, getApiVersion } from '@progresskinvey/js-sdk-init';
import { DataStoreNetwork } from '../network';

jest.mock('@progresskinvey/js-sdk-http', () => {
  return {
    formatKinveyBaasUrl: jest.fn(),
    KinveyNamespace: { AppData: 'AppData' },
    kinveySessionAuth: jest.fn(),
    KinveyHttpRequest: jest.fn().mockImplementation(() => {
      return {
        execute: jest.fn(),
      };
    }),
  };
});

const collectionName = 'test';
const network = new DataStoreNetwork(collectionName);
let formatUrlSpy;
let sendRequestSpy;

beforeEach(() => {
  // @ts-ignore
  formatUrlSpy = jest.spyOn(network, 'formatUrl');
  // @ts-ignore
  sendRequestSpy = jest.spyOn(network, 'sendRequest');
});

afterEach(() => {
  formatUrlSpy.mockReset();
  sendRequestSpy.mockReset();
});

afterAll(() => jest.restoreAllMocks());

describe('find()', () => {
  it('should send the correct http request', async () => {
    await network.find();
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/',
      query: { kinveyfile_ttl: undefined, kinveyfile_tls: undefined },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options: {},
    });
  });

  it('should send the correct http request with query', async () => {
    const query = new Query().equalTo('foo', 'bar');
    await network.find(query);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/',
      query: {
        ...query.toQueryObject(),
      },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options: {},
    });
  });

  it('should send the correct http request with options', async () => {
    const options = {
      kinveyFileTTL: 1,
      kinveyFileTLS: true,
      skipBL: true,
      trace: true,
      properties: {},
    };
    await network.find(null, options);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/',
      query: {
        kinveyfile_ttl: options.kinveyFileTTL,
        kinveyfile_tls: options.kinveyFileTLS,
      },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options,
    });
  });
});

describe('findByDeltaSet()', () => {
  it('should send the correct http request', async () => {
    const options = { since: new Date().toUTCString() };
    await network.findByDeltaSet(null, options);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/_deltaset',
      query: {
        since: options.since,
      },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options,
    });
  });
});

describe('findById()', () => {
  it('should send the correct http request', async () => {
    const id = 'id';
    await network.findById(id);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: `/${id}`,
      query: { kinveyfile_ttl: undefined, kinveyfile_tls: undefined },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options: {},
    });
  });
});

describe('count()', () => {
  it('should send the correct http request', async () => {
    await network.count();
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/_count', query: {} });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options: {},
    });
  });

  it('should send the correct http request with query', async () => {
    const query = new Query().equalTo('foo', 'bar');
    await network.count(query);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/_count',
      query: {
        ...query.toQueryObject(),
      },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'GET',
      options: {},
    });
  });
});

describe('group()', () => {
  it('should send the correct http request', async () => {
    const aggregation = Aggregation.max('field');
    await network.group(aggregation);
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/_group' });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'POST',
      body: aggregation.toPlainObject(),
      options: {},
    });
  });
});

describe('create()', () => {
  it('should send the correct http request for a single entity', async () => {
    const entity = {};
    await network.create(entity);
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/' });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'POST',
      body: entity,
      options: {},
    });
  });

  describe('with an array of entities', () => {
    const currentApiVersion = getApiVersion();

    beforeAll(() => {
      setApiVersion(5);
    });

    afterAll(() => {
      setApiVersion(currentApiVersion);
    });

    it('should send the correct http request with a length less than 100', async () => {
      const entities = [];
      let i = 0;
      while (i < 1) {
        entities.push({});
        i += 1;
      }
      await network.create(entities);
      expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/' });
      expect(sendRequestSpy).toHaveBeenCalledWith({
        method: 'POST',
        body: entities,
        options: {},
      });
    });

    it('should send the correct http request with a length equal to 100', async () => {
      const entities = [];
      let i = 0;
      while (i < 100) {
        entities.push({});
        i += 1;
      }
      await network.create(entities);
      expect(formatUrlSpy).toHaveBeenCalledTimes(1);
      expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/' });
      expect(sendRequestSpy).toHaveBeenCalledTimes(1);
      expect(sendRequestSpy).toHaveBeenCalledWith({
        method: 'POST',
        body: entities,
        options: {},
      });
    });

    it('should send the correct http request with a length greater than 100', async () => {
      const entities = [];
      let i = 0;
      while (i < 101) {
        entities.push({});
        i += 1;
      }
      await network.create(entities);
      expect(formatUrlSpy).toHaveBeenCalledTimes(2);
      expect(sendRequestSpy).toHaveBeenCalledTimes(2);
    });
  });
});

describe('update()', () => {
  it('should throw an error if the entity does not have an _id', async () => {
    await expect(network.update({})).rejects.toThrow(
      new Error('The entity provided does not contain an _id. An _id is required to update the entity.')
    );
  });

  it('should send the correct http request', async () => {
    const entity = { _id: 'id' };
    await network.update(entity);
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: `/${entity._id}` });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      body: entity,
      options: {},
    });
  });
});

describe('remove()', () => {
  it('should send the correct http request', async () => {
    await network.remove();
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: '/', query: {} });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      options: {},
    });
  });

  it('should send the correct http request with query', async () => {
    const query = new Query().equalTo('foo', 'bar');
    await network.remove(query);
    expect(formatUrlSpy).toHaveBeenCalledWith({
      path: '/',
      query: {
        ...query.toQueryObject(),
      },
    });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      options: {},
    });
  });
});

describe('removeById()', () => {
  it('should send the correct http request', async () => {
    const id = 'id';
    await network.removeById(id);
    expect(formatUrlSpy).toHaveBeenCalledWith({ path: `/${id}` });
    expect(sendRequestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      options: {},
    });
  });
});

describe('formatUrl()', () => {
  beforeEach(() => {
    formatUrlSpy.mockRestore();
  });

  it('should format the url correctly', () => {
    const path = '/';
    const query = { foo: 'bar' };
    // @ts-ignore
    network.formatUrl({ path });
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(
      KinveyNamespace.AppData,
      urlJoin(network.collectionName, path),
      undefined
    );
    // @ts-ignore
    network.formatUrl({ path, query });
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(
      KinveyNamespace.AppData,
      urlJoin(network.collectionName, path),
      query
    );
  });
});

describe('sendRequest()', () => {
  beforeEach(() => {
    sendRequestSpy.mockRestore();
  });

  it('should send the correct http request', async () => {
    const method = 'GET';
    const url = '/url';
    const body = {};
    const options = {
      skipBL: true,
      trace: true,
      properties: true,
    };
    // @ts-ignore
    await network.sendRequest({ method, url, body, options });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method,
      auth: kinveySessionAuth,
      url,
      body,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
  });
});
