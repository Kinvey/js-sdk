export interface SessionStore {
  get(key: string): string | null;
  set(key: string, session: string): void;
  remove(key: string): boolean;
}

class DefaultSessionStore {
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key);
  }

  set(key: string, session: string): void {
    this.store.set(key, session);
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }
}

let store: SessionStore = new DefaultSessionStore();


export function getSessionStore(): SessionStore {
  return store;
}

export function setSessionStore(_store: SessionStore): void {
  store = _store;
}

export function get(key: string): null | string {
  return getSessionStore().get(key);
}

export function set(key: string, session: string): void {
  getSessionStore().set(key, session);
}

export function remove(key: string): boolean {
  return getSessionStore().remove(key);
}
