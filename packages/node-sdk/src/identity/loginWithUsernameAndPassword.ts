import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { KinveyError } from '../errors';
import { UserData, User } from '../user';
import { login } from './login';

export async function loginWithUsernameAndPassword<T extends UserData>(
  username: string,
  password: string
): Promise<User<T>> {
  if (!isString(username) || !isString(password)) {
    throw new KinveyError(
      'Username and/or password are not a string. Please provide both a username and password as a string to login.'
    );
  }

  if (isEmpty(username) || isEmpty(password)) {
    throw new KinveyError('Username and/or password missing. Please provide both a username and password to login.');
  }

  return login<T>({ username, password });
}
