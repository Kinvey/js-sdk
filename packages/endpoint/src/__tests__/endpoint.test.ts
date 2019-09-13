import {
  KinveyHttpRequest,
  kinveySessionOrMasterAuth,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
} from '@progresskinvey/js-sdk-http';
import { endpoint } from '../endpoint';

jest.mock('@progresskinvey/js-sdk-http', () => {
  return {
    formatKinveyBaasUrl: jest.fn(() => 'url'),
    kinveySessionOrMasterAuth: jest.fn(() => Promise.resolve('auth')),
    KinveyHttpRequest: jest.fn().mockImplementation(() => {
      return { execute: jest.fn(async () => ({})) };
    }),
    KinveyBaasNamespace: {},
  };
});

afterAll(() => jest.restoreAllMocks());

it('should throw an error if an endpoint is not a string', async () => {
  // @ts-ignore
  await expect(endpoint()).rejects.toEqual(new Error('A path is required and must be a string.'));
  // @ts-ignore
  await expect(endpoint({})).rejects.toEqual(new Error('A path is required and must be a string.'));
});

it('should send a KinveyHttpRequest to the endpoint with no arguments', async () => {
  const path = 'test';
  await endpoint(path);
  expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.Rpc, `/custom/${path}`);
  expect(KinveyHttpRequest).toHaveBeenCalledWith({
    method: 'POST',
    auth: kinveySessionOrMasterAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${path}`),
    body: undefined,
    timeout: undefined,
  });
});

it('should send a KinveyHttpRequest to the endpoint with arguments', async () => {
  const path = 'test';
  const args = {};
  await endpoint(path, args);
  expect(formatKinveyBaasUrl).toHaveBeenCalledWith(KinveyBaasNamespace.Rpc, `/custom/${path}`);
  expect(KinveyHttpRequest).toHaveBeenCalledWith({
    method: 'POST',
    auth: kinveySessionOrMasterAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${path}`),
    body: args,
    timeout: undefined,
  });
});

it('should send a KinveyHttpRequest with the specified timeout', async () => {
  const path = 'test';
  const timeout = 1;
  await endpoint(path, undefined, { timeout });
  expect(KinveyHttpRequest).toHaveBeenCalledWith({
    method: 'POST',
    auth: kinveySessionOrMasterAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${path}`),
    body: undefined,
    timeout,
  });
});
