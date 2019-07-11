import isString from 'lodash/isString';
import { KinveyError } from '../errors';
import { KinveyHttpRequest, HttpRequestMethod, formatKinveyBaasUrl, KinveyBaasNamespace, kinveyAppAuth } from '../http';

export interface VerifyEmailOptions {
  timeout?: number;
}

export async function verifyEmail(username: string, options: VerifyEmailOptions = {}): Promise<void> {
  if (!isString(username)) {
    throw new KinveyError('The username is not a string.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/${username}/user-email-verification-initiate`),
    timeout: options.timeout
  });
  await request.execute();
}
