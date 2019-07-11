import isString from 'lodash/isString';
import { KinveyError } from '../errors';
import { getAppKey } from '../init';
import { login } from './login';
// import { loginWithPopup, getTokenWithCode } from './mic';
// import { signup } from './signup';
import { User, UserData, getActiveUser, signup } from '../user';

export interface MICOptions {
  micId?: string;
  version?: string | number;
  timeout?: number;
}

export async function loginWithRedirectUri<T extends UserData>(
  redirectUri: string,
  options: MICOptions = {}
): Promise<User<T>> {
  const activeUser = getActiveUser();
  let clientId = getAppKey();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  if (!isString(redirectUri)) {
    throw new KinveyError('A redirectUri is required and must be a string.');
  }

  if (isString(options.micId)) {
    clientId = `${clientId}.${options.micId}`;
  }
  return {} as any;

  // const code = await loginWithPopup(clientId, redirectUri, version);
  // const token = await getTokenWithCode(code, clientId, redirectUri, options);
  // const credentials = { _socialIdentity: { [token.identity]: token } };

  // try {
  //   return await login(credentials);
  // } catch (error) {
  //   if (error instanceof NotFoundError) {
  //     return signup(credentials);
  //   }

  //   throw error;
  // }
}
