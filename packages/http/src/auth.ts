/* eslint no-underscore-dangle: "off" */

import { getAppKey, getAppSecret } from '@kinveysdk/app';
import { getSession } from '@kinveysdk/session';
import { KinveyError } from '@kinveysdk/errors';
import { Base64 } from 'js-base64';

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

export function kinveySessionOrAppAuth(): Promise<string> {
  try {
    return kinveySessionAuth();
  } catch (error) {
    return kinveyAppAuth();
  }
}
