import { Base64 } from 'js-base64';
import { parse } from 'url';
import isString from 'lodash/isString';
import { KinveyError, NotFoundError } from '../errors';
import { getAppKey, getAppSecret } from '../init';
import { User, UserData, getActiveUser } from '../user';
import { formatKinveyAuthUrl, KinveyHttpRequest, HttpRequestMethod } from '../http';
import { open as openPopup } from './popup';
import { login } from './login';
import { signup } from './signup';

function loginWithPopup(redirectUri: string, clientId: string, version: number = 3): Promise<string> {
  return new Promise(
    async (resolve, reject): Promise<void> => {
      const url = formatKinveyAuthUrl(`/v${version}/oauth/auth`, {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid'
      });
      const popup = await openPopup(url);
      let redirected = false;

      popup.onLoaded(
        async (event): Promise<void> => {
          try {
            if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
              const parsedUrl = parse(event.url, true);
              const { code, error, error_description } = parsedUrl.query;

              redirected = true;
              popup.removeAllListeners();
              await popup.close();

              if (code) {
                resolve(code as string);
              } else if (error) {
                reject(new KinveyError(error as string, error_description as string));
              } else {
                reject(new KinveyError('No code or error was provided.'));
              }
            }
          } catch (error) {
            // Just catch the error
          }
        }
      );

      popup.onClosed((): void => {
        if (!redirected) {
          popup.removeAllListeners();
          reject(new KinveyError('Unable to login with popup.'));
        }
      });
    }
  );
}

interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  redirectUri: string,
  version: number = 3
): Promise<Token> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: (): string => {
        const credentials = Base64.encode(`${clientId}:${getAppSecret()}`);
        return `Basic ${credentials}`;
      }
    },
    url: formatKinveyAuthUrl(`/c${version}/oauth/token`),
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

export interface MICOptions {
  micId?: string;
  version?: number;
}

export async function loginWithRedirectUri<T extends UserData>(
  redirectUri: string,
  options: MICOptions = {}
): Promise<User<T>> {
  const activeUser = getActiveUser();
  let clientId = getAppKey();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  if (!isString(redirectUri)) {
    throw new KinveyError('A redirectUri is required and must be a string.');
  }

  if (isString(options.micId)) {
    clientId = `${clientId}.${options.micId}`;
  }

  const code = await loginWithPopup(redirectUri, clientId, options.version);
  const token = await exchangeCodeForToken(code, clientId, redirectUri, options.version);
  const credentials = { _socialIdentity: { kinveyAuth: { access_token: token.access_token } } };

  try {
    return await login(credentials);
  } catch (error) {
    if (error instanceof NotFoundError) {
      await signup(credentials);
      return login(credentials);
    }

    throw error;
  }
}
