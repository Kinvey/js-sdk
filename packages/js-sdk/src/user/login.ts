import has from 'lodash/has';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import unset from 'lodash/unset';
import { ActiveUserError } from '../errors/activeUser';
import { KinveyError } from '../errors/kinvey';
import { setSession, formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';
import { getActiveUser } from './getActiveUser';
import { User } from './user';
import { mergeSocialIdentity } from './utils';

export interface LoginOptions {
  timeout?: number;
}

export function validateNoActiveUser() {
  const activeUser = getActiveUser();
  if (activeUser) {
    throw new ActiveUserError('An active user already exists. Please logout the active user before you login.');
  }
}

export async function executeLoginRequest(reqBody: object, timeout?: number): Promise<any> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.App,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/login'),
    body: reqBody,
    timeout
  });

  const response = await request.execute();
  const { data } = response;

  // Remove sensitive data
  unset(data, 'password');
  unset(data, 'user.password');

  if (!has(data, 'mfaRequired')) {
    return {
      mfaRequired: false,
      user: data,
    };
  }

  if (!data.mfaRequired) {
    data.user._kmd.authtoken = data.authToken;
  }

  return data;
}

export function validateCredentials(username: string, password: string): any {
  const credentials: any = { username, password };

  if (credentials.username) {
    credentials.username = String(credentials.username).trim();
  }

  if (credentials.password) {
    credentials.password = String(credentials.password).trim();
  }

  if (!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  return credentials;
}

export async function login(username: string | { username?: string, password?: string, _socialIdentity?: any }, password?: string, options: LoginOptions = {}) {
  validateNoActiveUser();

  let credentials: any = { username, password };
  let timeout = options.timeout;

  if (isPlainObject(username)) {
    credentials = username;

    if (isPlainObject(password)) {
      timeout = (password as LoginOptions).timeout;
    }
  }

  if (credentials.username) {
    credentials.username = String(credentials.username).trim();
  }

  if (credentials.password) {
    credentials.password = String(credentials.password).trim();
  }

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity) {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  const result = await executeLoginRequest(credentials, timeout);
  if (result.mfaRequired) {
    throw new KinveyError('MFA login is required.');
  }

  const session = result.user;

  // Merge _socialIdentity
  if (credentials._socialIdentity) {
    session._socialIdentity = mergeSocialIdentity(credentials._socialIdentity, session._socialIdentity);
  }

  // Store the active session
  setSession(session);

  // Return the user
  return new User(session);
}
