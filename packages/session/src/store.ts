import { getConfig, ConfigKey } from '@kinveysdk/sdk-config';

export interface SessionStore {
  get(key: string): string | null;
  set(key: string, session: string): boolean;
  remove(key: string): boolean;
}

function getStore(): SessionStore {
  return getConfig<SessionStore>(ConfigKey.SessionStorageAdapter);
}

export function get(key: string): null | string {
  return getStore().get(key);
}

export function set(key: string, session: string): boolean {
  return getStore().set(key, session);
}

export function remove(key: string): boolean {
  return getStore().remove(key);
}
