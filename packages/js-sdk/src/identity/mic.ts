import isString from 'lodash/isString';
import { Base64 } from 'js-base64';
import { formatKinveyAuthUrl, KinveyHttpRequest, HttpRequestMethod } from '../http';
import { getAppSecret, getAppKey } from '../init';
import { MICToken } from '../session';

export interface MICOptions {
  micId?: string;
  version?: number;
  timeout?: number;
}

export function getClientId(micId?: string): string {
  let clientId = getAppKey();
  if (isString(micId)) {
    clientId = `${clientId}.${micId}`;
  }
  return clientId;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  options: MICOptions = {}
): Promise<MICToken> {
  const clientId = getClientId(options.micId);
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: (): string => {
        const credentials = Base64.encode(`${clientId}:${getAppSecret()}`);
        return `Basic ${credentials}`;
      }
    },
    url: formatKinveyAuthUrl(options.version, '/oauth/token'),
    body: {
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code
    }
  });
  const response = await request.execute();
  return response.data;
}

export async function exchangeUsernameAndPasswordForToken(
  username: string,
  password: string,
  options: MICOptions = {}
): Promise<MICToken> {
  const clientId = getClientId(options.micId);
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: (): string => {
        const credentials = Base64.encode(`${clientId}:${getAppSecret()}`);
        return `Basic ${credentials}`;
      }
    },
    url: formatKinveyAuthUrl(options.version, '/oauth/token'),
    body: {
      grant_type: 'password',
      client_id: clientId,
      username,
      password
    },
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
