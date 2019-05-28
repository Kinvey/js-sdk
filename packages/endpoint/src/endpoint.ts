import isString from 'lodash/isString';
import { KinveyError } from '@kinveysdk/errors';
import {
  send,
  kinveySessionOrAppAuth,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  HttpRequest,
  HttpRequestMethod
} from '@kinveysdk/http';

export async function endpoint(endpointPath: string, args?: any): Promise<any> {
  if (!isString(endpointPath)) {
    throw new KinveyError('You must provide an endpoint as a string.');
  }

  const request = new HttpRequest({
    method: HttpRequestMethod.POST,
    headers: {
      'Authorization': kinveySessionOrAppAuth
    },
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`),
    body: args
  });
  const response = await send(request);
  return response.data;
}
