import { SessionStore } from '@kinveysdk/session';

const store = new Map<string, string>();

export class NodeSessionStore implements SessionStore {
  get(key: string): string {
    return store.get(key);
  }

  set(key: string, session: string): boolean {
    store.set(key, session);
    return true;
  }

  remove(key: string): boolean {
    return store.delete(key);
  }
}
