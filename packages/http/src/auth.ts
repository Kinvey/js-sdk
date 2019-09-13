import { Base64 } from 'js-base64';
import { getAppKey, getAppSecret, getMasterSecret } from '@progresskinvey/js-sdk-init';
import { getSession } from './session';

export async function kinveyAppAuth(): Promise<string> {
  const credentials = Base64.encode(`${getAppKey()}:${getAppSecret()}`);
  return `Basic ${credentials}`;
}

export async function kinveyMasterAuth(): Promise<string> {
  const credentials = Base64.encode(`${getAppKey()}:${getMasterSecret()}`);
  return `Basic ${credentials}`;
}

export async function kinveySessionAuth(): Promise<string> {
  const session = getSession();

  if (!session) {
    throw new Error('There is no active session to authorize the request. Please login and retry the request.');
  }

  return `Kinvey ${session._kmd.authtoken}`;
}

export async function kinveySessionOrAppAuth(): Promise<string> {
  try {
    return await kinveySessionAuth();
  } catch (error) {
    return kinveyAppAuth();
  }
}

export async function kinveySessionOrMasterAuth(): Promise<string> {
  try {
    return await kinveySessionAuth();
  } catch (error) {
    return kinveyMasterAuth();
  }
}
