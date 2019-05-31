import isString from 'lodash/isString';
import { KinveyError } from '@kinveysdk/errors';
import {
  kinveySessionOrAppAuth,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  KinveyHttpRequest,
  HttpRequestMethod
} from '@kinveysdk/http';

export async function endpoint(endpointPath: string, args?: any): Promise<any> {
  if (!isString(endpointPath)) {
    throw new KinveyError('You must provide an endpoint as a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveySessionOrAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`),
    body: args
  });
  const response = await request.execute();
  return response.data;
}
