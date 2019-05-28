import { getAppKey } from '@kinveysdk/app';
import { get, set, remove } from './store';

function getSessionKey(): string {
  return `${getAppKey()}.active_user`;
}

export interface SessionObject {
  _id: string;
  _kmd: {
    authtoken: string;
  }
}

export function getSession(): SessionObject | null {
  const key = getSessionKey();
  const session = get(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: SessionObject): void {
  const key = getSessionKey();
  set(key, JSON.stringify(session));
}

export function removeSession(): boolean {
  const key = getSessionKey();
  return remove(key);
}
