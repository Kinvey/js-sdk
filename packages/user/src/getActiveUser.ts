import { getSession } from '@kinveysdk/session';
import { User, UserData } from './user';

export function getActiveUser<T extends UserData>(): User<T> | null {
  const session = getSession();
  if (session) {
    return new User<T>(session as T);
  }
  return null;
}
