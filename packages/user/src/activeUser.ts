import { getSession } from '@progresskinvey/js-sdk-http';
import { User } from './user';

export function getActiveUser(): User | null {
  const session = getSession();

  if (session) {
    return new User(session);
  }

  return null;
}
