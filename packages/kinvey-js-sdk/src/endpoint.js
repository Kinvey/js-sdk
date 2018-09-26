import isString from 'lodash/isString';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from './http';

const RPC_NAMESPACE = 'rpc';

export default async function endpoint(endpoint, args) {
  if (!isString(endpoint)) {
    throw new Error('An endpoint is required and must be a string.');
  }

  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Session,
    url: formatKinveyBaasUrl(`/${RPC_NAMESPACE}/appKey/custom/${endpoint}`),
    body: args
  });
  const response = await execute(request);
  return response.data;
}
