import { parse } from 'url';
import isString from 'lodash/isString';
import { KinveyError } from '../errors';
import { User, UserData, getActiveUser } from '../user';
import { formatKinveyAuthUrl } from '../http';
import { open as openPopup } from './popup';
import { login } from './login';
import { exchangeCodeForToken, MICOptions, getClientId } from './mic';
import { setMICToken } from '../session';

function loginWithPopup(redirectUri: string, options: MICOptions = {}): Promise<string> {
  return new Promise(
    async (resolve, reject): Promise<void> => {
      const clientId = getClientId(options.micId);
      const url = formatKinveyAuthUrl(options.version, '/oauth/auth', {
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
                reject(new KinveyError('No code or error was provided in the redirect url used for the MIC popup.'));
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
          reject(new KinveyError('Unable to login with MIC using a popup.'));
        }
      });
    }
  );
}

export async function loginWithRedirectUri<T extends UserData>(
  redirectUri: string,
  options: MICOptions = {}
): Promise<User<T>> {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new KinveyError('An active user already exists. Please logout the active user before you login.');
  }

  if (!isString(redirectUri)) {
    throw new KinveyError('A redirectUri is required and must be a string.');
  }

  const code = await loginWithPopup(redirectUri, options);
  const token = await exchangeCodeForToken(code, redirectUri, options);
  const credentials = { _socialIdentity: { kinveyAuth: { access_token: token.access_token } } };
  const user = login<T>(credentials, { signup: true });

  // Update the MIC token for the active session
  setMICToken(Object.assign({ client_id: getClientId(options.micId), redirect_uri: redirectUri }, token));

  // Return the user
  return user;
}
