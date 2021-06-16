import { ConfigKey, getConfig } from '../config';
import { getAppKey } from '../kinvey';
import { Entity } from '../storage';

export interface SessionObject extends Entity {
  _socialIdentity?: any;
}

export interface SessionStore {
  get(key: string): Promise<string>;
  set(key: string, session: string): Promise<boolean>;
  remove(key: string): Promise<boolean>;
}

function getStore() {
  return getConfig<SessionStore>(ConfigKey.SessionStore);
}

export function getKey() {
  return `${getAppKey()}.active_user`;
}

export async function getSession(): Promise<SessionObject> {
  const session = await getStore().get(getKey());
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export async function setSession(session: SessionObject): Promise<boolean> {
  return getStore().set(getKey(), JSON.stringify(session));
}

export async function removeSession(): Promise<boolean> {
  return getStore().remove(getKey());
}

function getMFAKey(): string {
  return `${getAppKey()}.mfa_session_token`;
}

export async function getMFASessionToken(): Promise<string> {
  return getStore().get(getMFAKey());
}

export async function setMFASessionToken(token: string): Promise<boolean> {
  return getStore().set(getMFAKey(), token);
}

export async function removeMFASessionToken(): Promise<boolean> {
  return getStore().remove(getMFAKey());
}

function getDeviceTokenKey(username: string): string {
  return `${getAppKey()}.${username}.device_token`;
}

export async function getDeviceToken(username: string): Promise<string> {
  return getStore().get(getDeviceTokenKey(username));
}

export async function hasDeviceToken(username: string): Promise<boolean> {
  const deviceToken = await getDeviceToken(username);
  return deviceToken != null;
}

export async function setDeviceToken(username: string, deviceToken: string): Promise<boolean> {
  return getStore().set(getDeviceTokenKey(username), deviceToken);
}

export async function removeDeviceToken(username: string): Promise<boolean> {
  return getStore().remove(getDeviceTokenKey(username));
}
