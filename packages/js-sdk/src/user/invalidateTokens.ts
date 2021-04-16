import { getActiveUser } from './getActiveUser';

export async function invalidateTokens() {
  const activeUser = getActiveUser();

  if (!activeUser) {
    return null;
  }

  return activeUser.invalidateTokens();
}
