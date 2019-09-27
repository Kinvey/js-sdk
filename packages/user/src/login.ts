import {
  formatKinveyBaasUrl,
  KinveyHttpRequest,
  KinveyNamespace,
  kinveyAppAuth,
  setSession,
} from '@progresskinvey/js-sdk-http';
import { User } from './user';
import { getActiveUser } from './activeUser';

export async function login(username: string, password: string): Promise<User> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you login.');
  }

  if (!username || username === '' || !password || password === '') {
    throw new Error('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new KinveyHttpRequest({
    method: 'POST',
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyNamespace.User, '/login'),
    body: { username, password },
  });
  const { data } = await request.execute();

  // Remove sensitive data
  delete data.password;

  // Store the active user
  setSession(data);

  // Return the user
  return new User(data);
}
