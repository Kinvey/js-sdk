import { KinveyError } from '../errors';
import {
  KinveyHttpRequest,
  HttpRequestMethod,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  kinveyAppAuth
} from '../http';
import { setSession } from '../session';
import { getActiveUser } from './getActiveUser';
import { User, UserData } from './user';

export interface SignupOptions {
  timeout?: number;
  state?: boolean;
}

export async function signup<T extends UserData>(data?: object, options: SignupOptions = {}): Promise<User<T>> {
  const activeUser = getActiveUser();

  if (options.state === true && activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you signup.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User),
    body: data
  });
  const response = await request.execute();
  const session = response.data;

  // Remove sensitive data
  delete session.password;

  // Store the active session
  if (options.state === true) {
    setSession(session);
  }

  return new User<T>(session);
}
