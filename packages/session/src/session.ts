/* eslint no-underscore-dangle: "off" */

import { getAppKey } from '@kinveysdk/app';
import { get, set, remove } from './store';

const MIC_IDENTITY = 'kinveyAuth';

function getSessionKey(): string {
  return `${getAppKey()}.active_user`;
}

interface MICSession {
  client_id: string,
  redirect_uri?: string,
  access_token: string,
  refresh_token?: string
}

export interface Session {
  _id: string
  _kmd: {
    authtoken: string
  },
  _socialIdentity?: {
    kinveyAuth?: MICSession
  }
}

export function getSession(): Session | null {
  const key = getSessionKey();
  const session = get(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: Session): void {
  const key = getSessionKey();
  set(key, JSON.stringify(session));
}

export function removeSession(): boolean {
  const key = getSessionKey();
  return remove(key);
}

export function getMICSession(): MICSession | null {
  const session = getSession();
  if (session && session._socialIdentity && session._socialIdentity[MIC_IDENTITY]) {
    return session._socialIdentity[MIC_IDENTITY];
  }
  return null;
}

export function setMICSession(micSession: MICSession): void {
  const session = getSession();
  session._socialIdentity = Object.assign(session._socialIdentity, { [MIC_IDENTITY]: micSession });
  setSession(session);
}
