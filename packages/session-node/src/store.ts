const store = new Map<string, string>();

export function get(key: string): string {
  return store.get(key);
}

export function set(key: string, session: string): void {
  store.set(key, session);
}

export function remove(key: string): boolean {
  return store.delete(key);
}
