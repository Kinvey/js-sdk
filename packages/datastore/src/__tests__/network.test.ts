import {
  KinveyHttpRequest,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  kinveySessionAuth,
} from '@progresskinvey/js-sdk-http';
import { Query } from '@progresskinvey/js-sdk-query';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { DataStoreNetwork } from '../network';

jest.mock('@progresskinvey/js-sdk-http', () => {
  return {
    formatKinveyBaasUrl: jest.fn(() => 'url'),
    kinveySessionAuth: jest.fn(() => Promise.resolve('auth')),
    KinveyHttpRequest: jest.fn().mockImplementation(() => {
      return { execute: jest.fn(async () => ({})) };
    }),
    KinveyBaasNamespace: {},
  };
});

afterAll(() => jest.restoreAllMocks());

const collectionName = 'test';

describe('find()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    await network.find();
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}`, {
      kinveyfile_ttl: undefined,
      kinveyfile_tls: undefined,
    });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${network.collectionName}`),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });

  it('should send the correct http request with query', async () => {
    const network = new DataStoreNetwork(collectionName);
    const query = new Query().equalTo('foo', 'bar');
    await network.find(query);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}`, {
      ...query.toQueryObject(),
      kinveyfile_ttl: undefined,
      kinveyfile_tls: undefined,
    });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
    });
  });

  it('should send the correct http request with options', async () => {
    const network = new DataStoreNetwork(collectionName);
    const options = {
      kinveyFileTTL: 1,
      kinveyFileTLS: true,
      skipBL: true,
      trace: true,
      properties: {},
    };
    await network.find(null, options);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}`, {
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS,
    });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
  });
});

describe('findByDeltaSet()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const options = { since: new Date().toUTCString() };
    await network.findByDeltaSet(null, options);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(
      KinveyBaasNamespace.AppData,
      `/${network.collectionName}/_deltaset`,
      {
        kinveyfile_ttl: undefined,
        kinveyfile_tls: undefined,
        since: options.since,
      }
    );
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('findById()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const id = 'id';
    await network.findById(id);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}/${id}`, {
      kinveyfile_ttl: undefined,
      kinveyfile_tls: undefined,
    });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('count()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    await network.count();
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}/_count`, {
      kinveyfile_ttl: undefined,
      kinveyfile_tls: undefined,
    });
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('group()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const aggregation = Aggregation.max('field');
    await network.group(aggregation);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}/_group`);
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      body: aggregation.toPlainObject(),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('create()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const entity = {};
    await network.create(entity);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}`);
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'POST',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      body: entity,
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('update()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const entity = { _id: 'id' };
    await network.update(entity);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(
      KinveyBaasNamespace.AppData,
      `/${network.collectionName}/${entity._id}`
    );
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'PUT',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      body: entity,
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('remove()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    await network.remove();
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}`, {});
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'DELETE',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});

describe('removeById()', () => {
  it('should send the correct http request', async () => {
    const network = new DataStoreNetwork(collectionName);
    const id = 'id';
    await network.removeById(id);
    expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.AppData, `/${network.collectionName}/${id}`);
    expect(KinveyHttpRequest).toHaveBeenCalledWith({
      method: 'DELETE',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
      skipBL: undefined,
      trace: undefined,
      properties: undefined,
    });
  });
});
