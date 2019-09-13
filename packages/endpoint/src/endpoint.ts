import isString from 'lodash/isString';
import {
  formatKinveyBaasUrl,
  KinveyHttpRequest,
  KinveyBaasNamespace,
  kinveySessionOrMasterAuth,
} from '@progresskinvey/js-sdk-http';

export interface EndpointOptions {
  timeout?: number;
}

export async function endpoint<T>(path: string, args?: any, options: EndpointOptions = {}): Promise<T> {
  if (!isString(path)) {
    throw new Error('A path is required and must be a string.');
  }

  const request = new KinveyHttpRequest({
    method: 'POST',
    auth: kinveySessionOrMasterAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${path}`),
    body: args,
    timeout: options.timeout,
  });
  const response = await request.execute();
  return response.data;
}
