import { KinveyError, NotFoundError } from '../errors';
import { KinveyHttpRequest, HttpRequestMethod, formatKinveyBaasUrl, KinveyBaasNamespace, kinveyAppAuth } from '../http';
import { setSession } from '../session';
import { User, UserData, getActiveUser } from '../user';
import { signup } from './signup';

export interface LoginOptions {
  signup?: boolean;
}

export async function login<T extends UserData>(credentials: object, options: LoginOptions = {}): Promise<User<T>> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  try {
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.POST,
      auth: kinveyAppAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
      body: credentials
    });
    const response = await request.execute();
    const session = response.data;

    // Remove sensitive data
    delete session.password;

    // Store the active session
    setSession(session);

    return new User<T>(session);
  } catch (error) {
    if (options.signup === true && error instanceof NotFoundError) {
      await signup(credentials);
      return login(credentials, options);
    }

    throw error;
  }
}
