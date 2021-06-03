import { ConfigKey, getConfig } from '../config';
import { getAppKey } from '../kinvey';
import { Entity } from '../storage';

export interface SessionObject extends Entity {
  _socialIdentity?: any;
}

export interface SessionStore {
  get(key: string): string | null;
  set(key: string, session: string): boolean;
  remove(key: string): boolean;
}

function getStore() {
  return getConfig<SessionStore>(ConfigKey.SessionStore);
}

export function getKey() {
  return `${getAppKey()}.active_user`;
}

export function getSession(): SessionObject | null {
  const session = getStore().get(getKey());
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: SessionObject): boolean {
  return getStore().set(getKey(), JSON.stringify(session));
}

export function removeSession(): boolean {
  return getStore().remove(getKey());
}

function getMFAKey(): string {
  return `${getAppKey()}.mfa_session_token`;
}

export function getMFASessionToken(): string | undefined {
  return getStore().get(getMFAKey());
}

export function setMFASessionToken(token: string): boolean {
  return getStore().set(getMFAKey(), token);
}

export function removeMFASessionToken(): boolean {
  return getStore().remove(getMFAKey());
}

function getDeviceTokenKey(username: string): string {
  return `${getAppKey()}.${username}.device_token`;
}

export function getDeviceToken(username: string): string | undefined {
  return getStore().get(getDeviceTokenKey(username));
}

export function hasDeviceToken(username: string): boolean {
  return getDeviceToken(username) != null;
}

export function setDeviceToken(username: string, deviceToken: string): boolean {
  return getStore().set(getDeviceTokenKey(username), deviceToken);
}

export function removeDeviceToken(username: string): boolean {
  return getStore().remove(getDeviceTokenKey(username));
}
