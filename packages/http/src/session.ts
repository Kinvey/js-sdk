import { getAppKey } from '@progresskinvey/js-sdk-init';

export interface SessionObject {
  _kmd: {
    authtoken?: string;
  };
  _socialIdentity?: any;
}

export interface SessionStore {
  get(key: string): string | null;
  set(key: string, session: string): boolean;
  remove(key: string): boolean;
}

let store: SessionStore = {
  get() {
    throw new Error('Please override the default session store.');
  },
  set() {
    throw new Error('Please override the default session store.');
  },
  remove() {
    throw new Error('Please override the default session store.');
  },
};

export function setSessionStore(_store: SessionStore): void {
  store = _store;
}

export function getKey(): string {
  return `${getAppKey()}.active_user`;
}

export function getSession(): SessionObject | null {
  const session = store.get(getKey());
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: SessionObject): boolean {
  return store.set(getKey(), JSON.stringify(session));
}

export function removeSession(): boolean {
  return store.remove(getKey());
}
