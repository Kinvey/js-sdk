import { KinveyError } from '../errors/kinvey';
import {
  setSession,
  setMFASessionToken,
  removeMFASessionToken,
  formatKinveyBaasUrl,
  HttpRequestMethod,
  KinveyHttpRequest,
  KinveyBaasNamespace,
  KinveyHttpAuth,
} from '../http';
import { User } from './user';
import { LoginOptions, validateNoActiveUser, executeLoginRequest, validateCredentials } from './login';

const errMsgNoAuthenticators = 'User has no MFA authenticators yet. Please enable MFA.';

export interface MFAContext {
  mfaSessionToken: string;
  retries: number;
  authenticator?: any;
  error?: any;
}

async function executeChallengeRequest(authenticatorId: string): Promise<any> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.MFASessionToken,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/mfa/challenge'),
    body: { authenticatorId },
  });

  const response = await request.execute();
  return response.data;
}

async function executeCompleteRequest(code): Promise<object> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.POST,
    auth: KinveyHttpAuth.MFASessionToken,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.User, '/mfa/complete'),
    body: { code },
  });

  const response = await request.execute();
  response.data.user._kmd.authtoken = response.data.authToken;
  return response.data;
}

async function completeMFALoginRetryable(
  mfaComplete: (authenticator: string, context: MFAContext) => Promise<string>,
  context: MFAContext
): Promise<any> {
  const errMsgNoCode = 'MFA code is missing.';
  try {
    const code = await mfaComplete(context.authenticator.id, context);
    if (code == null) {
      throw new KinveyError(errMsgNoCode);
    }
    const mfaResult = await executeCompleteRequest(code);
    return mfaResult;
  } catch (err) {
    if (err.message === errMsgNoCode) {
      throw err;
    }

    // eslint-disable-next-line no-param-reassign
    context.retries += 1;
    return completeMFALoginRetryable(mfaComplete, context);
  }
}

async function _loginWithMFA(
  username: string,
  password: string,
  selectAuthenticator: (authenticators: object[], context: MFAContext) => Promise<string>,
  mfaComplete: (authenticator: string, context: MFAContext) => Promise<string>,
  options: LoginOptions = {}
): Promise<User> {
  validateNoActiveUser();

  const credentials = validateCredentials(username, password);
  if (!selectAuthenticator) {
    throw new KinveyError('Function to select authenticator is missing.');
  }

  if (!mfaComplete) {
    throw new KinveyError('Function to complete MFA is missing.');
  }

  const loginResult = await executeLoginRequest(credentials, options.timeout);
  if (!loginResult.mfaRequired) {
    setSession(loginResult.user);
    return new User(loginResult.user);
  }

  setMFASessionToken(loginResult.mfaSessionToken);
  if (loginResult.authenticators.length === 0) {
    throw new KinveyError(errMsgNoAuthenticators);
  }

  const context = {
    mfaSessionToken: loginResult.mfaSessionToken,
    retries: 0,
    authenticator: null,
  };
  const selectedAuthenticatorId = await selectAuthenticator(loginResult.authenticators, context);
  if (selectedAuthenticatorId == null) {
    throw new KinveyError('MFA authenticator ID is missing.');
  }

  context.authenticator = loginResult.authenticators.find((a) => a.id === selectedAuthenticatorId);
  await executeChallengeRequest(selectedAuthenticatorId);

  const mfaResult = await completeMFALoginRetryable(mfaComplete, context);
  setSession(mfaResult.user);
  return new User(mfaResult.user);
}

export async function loginWithMFA(
  username: string,
  password: string,
  selectAuthenticator: (authenticators: object[], context: MFAContext) => Promise<string>,
  mfaComplete: (authenticator: string, context: MFAContext) => Promise<string>,
  options: LoginOptions = {}
): Promise<User> {
  try {
    return _loginWithMFA(username, password, selectAuthenticator, mfaComplete, options);
  } catch (err) {
    if (err.message !== errMsgNoAuthenticators) {
      removeMFASessionToken();
    }

    throw err;
  }
}
