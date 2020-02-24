import { expect } from 'chai';
import { User } from '../../src/user';

describe('User', function () {
  describe('signup()', function() {
    it('should exist', function() {
      const user = new User();
      expect(user.signup).to.exist;
    });
  });
});
