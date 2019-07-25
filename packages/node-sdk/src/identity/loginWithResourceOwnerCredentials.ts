import isString from 'lodash/isString';
import { UserData, User, getActiveUser } from '../user';
import { KinveyError } from '../errors';
import { login } from './login';
import { MICOptions, exchangeUsernameAndPasswordForToken, getClientId } from './mic';
import { setMICToken } from '../session';

export async function loginWithResourceOwnerCredentials<T extends UserData>(
  username: string,
  password: string,
  options?: MICOptions
): Promise<User<T>> {
  const activeUser = getActiveUser();
  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  if (!isString(username) || !isString(password)) {
    throw new KinveyError('A username and password are required and must be a string.');
  }

  const token = await exchangeUsernameAndPasswordForToken(username, password, options);
  const credentials = { _socialIdentity: { kinveyAuth: { access_token: token.access_token } } };
  const user = login<T>(credentials, { signup: true });

  // Update the MIC token for the active session
  setMICToken(Object.assign({ client_id: getClientId(options.micId) }, token));

  // Return the user
  return user;
}
