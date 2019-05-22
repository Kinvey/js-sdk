import { getAppKey } from '@kinveysdk/sdk-config';
import { get, set, remove } from './store';

function getSessionKey(): string {
  return `${getAppKey()}.active_user`;
}

export interface SessionObject {
  _id: string;
}

export function getSession(): null | SessionObject {
  const key = getSessionKey();
  const session = get(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: SessionObject): boolean {
  if (session) {
    const key = getSessionKey();
    return set(key, JSON.stringify(session));
  }
  return false;
}

export function removeSession(): boolean {
  const key = getSessionKey();
  return remove(key);
}
