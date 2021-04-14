import trim from 'lodash/trim';
import { KinveyError } from '../errors/kinvey';
import { setSession } from '../http';
import { User } from './user';
import { LoginOptions, validateNoActiveUser, executeLoginRequest, validateCredentials } from './login';

export async function loginWithRecoveryCode(
  username: string,
  password: string,
  recoveryCode: string,
  options: LoginOptions = {}
): Promise<User> {
  validateNoActiveUser();

  const credentials = validateCredentials(username, password);
  const trimmedCode = trim(recoveryCode);
  if (trimmedCode === '') {
    throw new KinveyError('Recovery code is missing.');
  }

  credentials.recoveryCode = trimmedCode;
  const loginResult = await executeLoginRequest(credentials, options.timeout);
  setSession(loginResult.user);
  return new User(loginResult.user);
}
