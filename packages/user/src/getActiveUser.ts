import { getSession } from '@kinveysdk/session';
import { User } from './user';

export function getActiveUser(): User | null {
  const session = getSession();
  if (session) {
    return new User(session);
  }
  return null;
}
