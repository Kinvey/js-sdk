import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { KinveyError } from '@kinveysdk/errors';
import {
  KinveyHttpRequest,
  HttpRequestMethod,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  kinveyAppAuth
} from '@kinveysdk/http';
import { setSession } from '@kinveysdk/session';
import { getActiveUser } from './getActiveUser';
import { User, UserData } from './user';

export async function login<T extends UserData>(username: string, password: string): Promise<User<T>> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  if (!isString(username) ||!isString(password)) {
    throw new KinveyError('Username and/or password are not a string. Please provide both a username and password as a string to login.');
  }

  if (isEmpty(username) || isEmpty(password)) {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: kinveyAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
    body: { username, password }
  });
  const response = await request.execute();
  const session = response.data;

  // Remove sensitive data
  delete session.password;

  // Store the active session
  setSession(session);

  return new User<T>(session);
}
