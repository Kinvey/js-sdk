import isString from 'lodash/isString';
import { KinveyError } from '@kinveysdk/errors';
import { send, formatKinveyBaasUrl, KinveyBaasNamespace, HttpRequest, HttpRequestMethod } from '@kinveysdk/http';

export async function endpoint(endpointPath: string, args?: any): Promise<any> {
  if (!isString(endpointPath)) {
    throw new KinveyError('You must provide an endpoint as a string.');
  }

  // const request = new KinveyHttpRequest({
  //   method: HttpRequestMethod.POST,
  //   auth: KinveyHttpAuth.SessionOrMaster,
  //   url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpoint}`),
  //   body: args,
  //   timeout: options.timeout
  // });
  // const response = await request.execute();

  const request = new HttpRequest({
    method: HttpRequestMethod.POST,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpoint}`),
    body: args
  });
  const response = await send(request);
  return response.data;
}
