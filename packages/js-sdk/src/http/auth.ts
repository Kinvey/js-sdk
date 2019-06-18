import { Base64 } from 'js-base64';
import { getAppKey, getAppSecret } from '../init';
import { getSession } from '../session';
import { KinveyError } from '../errors';

export async function kinveyAppAuth(): Promise<string> {
  const credentials = Base64.encode(`${getAppKey()}:${getAppSecret()}`);
  return `Basic ${credentials}`;
}

export async function kinveySessionAuth(): Promise<string> {
  const session = getSession();

  if (!session) {
    throw new KinveyError('There is no active session to authorize the request.', 'Please login and retry the request.');
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
