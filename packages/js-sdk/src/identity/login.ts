import { KinveyError } from '../errors';
import { KinveyHttpRequest, HttpRequestMethod, formatKinveyBaasUrl, KinveyBaasNamespace, kinveyAppAuth } from '../http';
import { setSession } from '../session';
import { User, UserData, getActiveUser } from '../user';

export async function login<T extends UserData>(credentials: object): Promise<User<T>> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

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
}
