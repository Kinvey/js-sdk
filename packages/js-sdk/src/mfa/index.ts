import { getActiveUser } from '../user/getActiveUser';
import { CreateMFAAuthenticatorResult, MFAAuthenticator, NewMFAAuthenticator, VerifyContext } from '../user/user';
import { KinveyError } from '../errors/kinvey';

async function callOnActiveUser(funcName, ...args): Promise<any> {
  const activeUser = getActiveUser();
  if (!activeUser) {
    throw new KinveyError('An active user does not exist. Please login one first.');
  }

  return activeUser[funcName](...args);
}

const Authenticators = {
  create: async function create(
    newAuthenticator: NewMFAAuthenticator,
    verify: (authenticator: MFAAuthenticator, context: VerifyContext) => Promise<string>
  ): Promise<CreateMFAAuthenticatorResult> {
    return callOnActiveUser('createAuthenticator', newAuthenticator, verify);
  },
  list: async function list(): Promise<MFAAuthenticator[]> {
    return callOnActiveUser('listAuthenticators');
  },
  remove: async function remove(id: string) {
    return callOnActiveUser('removeAuthenticator', id);
  },
};

async function listRecoveryCodes(): Promise<string[]> {
  return callOnActiveUser('listRecoveryCodes');
}

async function regenerateRecoveryCodes(): Promise<string[]> {
  return callOnActiveUser('regenerateRecoveryCodes');
}

async function isEnabled(): Promise<boolean> {
  return (await Authenticators.list()).length > 0;
}

async function disable() {
  const authenticators = await Authenticators.list();
  const activeUser = getActiveUser();
  return Promise.all(authenticators.map((a) => activeUser.removeAuthenticator(a.id)));
}

export { Authenticators, listRecoveryCodes, regenerateRecoveryCodes, isEnabled, disable };
