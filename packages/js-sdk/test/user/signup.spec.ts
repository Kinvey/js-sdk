import { expect } from 'chai';
import { KinveyError } from '../../src/errors';
import { signup } from '../../src/user/signup';
import {init} from "../../src";
import * as httpAdapter from "../http";
import * as sessionStore from "../sessionStore";
import * as memoryStorageAdapter from "../memory";

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';

describe('User Signup', function () {
  beforeAll(function () {
    return init({
      kinveyConfig: {
        appKey: APP_KEY,
        appSecret: APP_SECRET
      },
      httpAdapter,
      sessionStore: sessionStore,
      popup: null,
      storageAdapter: memoryStorageAdapter,
      pubnub: null
    })
  });

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
