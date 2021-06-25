import { getActiveUser } from '../user/getActiveUser';
import { CreateMFAAuthenticatorResult, MFAAuthenticator, NewMFAAuthenticator, VerifyContext } from '../user/user';
import { KinveyError } from '../errors/kinvey';

async function callOnActiveUser(funcName, ...args): Promise<any> {
  const activeUser = await getActiveUser();
  if (!activeUser) {
    throw new KinveyError('An active user does not exist. Please login one first.');
  }

  return activeUser[funcName](...args);
}

const Authenticators = {
  create: function create(
    newAuthenticator: NewMFAAuthenticator,
    verify: (authenticator: MFAAuthenticator, context: VerifyContext) => Promise<string>
  ): Promise<CreateMFAAuthenticatorResult> {
    return callOnActiveUser('createAuthenticator', newAuthenticator, verify);
  },
  list: function list(): Promise<MFAAuthenticator[]> {
    return callOnActiveUser('listAuthenticators');
  },
  remove: function remove(id: string): Promise<any> {
    return callOnActiveUser('removeAuthenticator', id);
  },
};

function listRecoveryCodes(): Promise<string[]> {
  return callOnActiveUser('listRecoveryCodes');
}

function regenerateRecoveryCodes(): Promise<string[]> {
  return callOnActiveUser('regenerateRecoveryCodes');
}

async function isEnabled(): Promise<boolean> {
  return (await Authenticators.list()).length > 0;
}

async function disable(): Promise<any> {
  const authenticators = await Authenticators.list();
  const activeUser = await getActiveUser();
  await Promise.all(authenticators.map((a) => activeUser.removeAuthenticator(a.id)));
  return true;
}

export { Authenticators, listRecoveryCodes, regenerateRecoveryCodes, isEnabled, disable };
