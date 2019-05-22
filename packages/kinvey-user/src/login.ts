import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { KinveyError } from '@kinveysdk/errors';
import { HttpRequest, HttpRequestMethod, formatKinveyBaasUrl, KinveyBaasNamespace, send } from '@kinveysdk/http';
import { getActiveUser } from './getActiveUser';
import { User } from './user';

export async function login(username: string, password: string): Promise<User> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.')
  }

  if (!isString(username) ||!isString(password)) {
    throw new KinveyError('Username and/or password are not a string. Please provide both a username and password as a string to login.');
  }

  if (isEmpty(username) || isEmpty(password)) {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new HttpRequest({
    method: HttpRequestMethod.POST,
    // auth: KinveyHttpAuth.App,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
    body: { username, password }
  });
  const response = await send(request);
  const session = response.data;

  // Remove sensitive data
  delete session.password;

  // // Store the active session
  // setSession(session);

  return new User(session);
}
