/// <reference types="mocha" />

import { expect } from 'chai';
import { KinveyError } from '../../src/errors';
import { signup } from '../../src/user/signup';

describe('User Signup', function () {
  it('should throw an error if a plain object is not provided', async function () {
    try {
      // @ts-ignore
      await signup('name', 'pass');
      throw new Error('This test should fail.');
    } catch (error) {
      expect(error).to.be.instanceof(KinveyError);
      expect(error.message).to.equal('The provided data must be an object.')
    }
  });
});
