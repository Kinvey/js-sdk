import { SecureStorage } from '@nativescript/secure-storage';
import * as live from './live';

export function get(key: string) {
  const secureStorage = new SecureStorage();
  return secureStorage.getSync({ key });
}

export function set(key: string, session: string): boolean {
  const secureStorage = new SecureStorage();
  const result = secureStorage.setSync({
    key,
    value: session
  });

  if (result) {
    live.startMonitoring();
  }

  return result;
}

export function remove(key: string): boolean {
  const secureStorage = new SecureStorage();
  const result = secureStorage.removeSync({ key });

  if (result) {
    live.stopMonitoring();
  }

  return result;
}
