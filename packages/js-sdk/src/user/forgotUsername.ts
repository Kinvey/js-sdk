import isString from 'lodash/isString';
import { KinveyError } from '../errors';
import { formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, kinveyAppAuth } from '../http';

export interface ExistsOptions {
  timeout?: number;
}

export async function exists(username: string, options: ExistsOptions = {}): Promise<boolean> {
  if (!isString(username)) {
    throw new KinveyError('A username must be provided and must be a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, '/check-username-exists'),
    body: { username },
    timeout: options.timeout
  });
  const response = await request.execute();
  return 'usernameExists' in response.data ? response.data.usernameExists === true : false;
}
