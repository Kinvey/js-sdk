import { expect } from 'chai';
import { init, User } from '__SDK__';
import { randomString, setOfflineProvider } from '../utils';

before(() => {
  const initProperties = {
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  }
  return init(setOfflineProvider(initProperties, process.env.OFFLINE_STORAGE));
});

describe('Auth', function() {
  beforeEach('ensure no logged-in user', async function() {
    await User.logout();
  });

  describe('login()', function() {
    it('should login', async function() {
      const username = randomString();
      const password = randomString();
      await User.signup({ username, password });
      const user = await User.login(username, password);
      expect(user.username).to.equal(username);
      await User.remove(user._id, { hard: true });
    });
  });

  describe('logout()', function() {
    it('should logout', async function() {
      const username = randomString();
      const password = randomString();
      const user = await User.signup({ username, password });
      await User.logout();
      expect(await User.getActiveUser()).to.be.null;
      await User.login(username, password);
      await User.remove(user._id, { hard: true });
    });

    it('should logout when there is not an active user', async function() {
      expect(await User.getActiveUser()).to.be.null;
      await User.logout();
      expect(await User.getActiveUser()).to.be.null;
    });
  });

  describe('signup()', () => {
    it('should signup', async function() {
      const username = randomString();
      const password = randomString();
      const user = await User.signup({ username, password });
      await User.remove(user._id, { hard: true });
    });

    it('should signup with additional properties', async function() {
      const username = randomString();
      const password = randomString();
      const name = randomString();
      const user = await User.signup({ username, password, name });
      expect(user.data).to.have.property('name', name);
      await User.remove(user._id, { hard: true });
    });
  });
});
