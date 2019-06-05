/* eslint spaced-comment: "off" */
/* eslint func-names: "off" */
/* eslint no-undef: "off" */
/* eslint @typescript-eslint/explicit-function-return-type: "off" */
/* eslint import/no-extraneous-dependencies: "off" */

/// <reference types="mocha" />

import { expect } from 'chai';
import { getHttpAdapter } from '@kinveysdk/http';
import { register } from '../src/index';
import * as http from '../src/http';

describe('register()', function() {
  it('should register the http adapter', function () {
    register();
    expect(getHttpAdapter()).to.deep.equal(http);
  });
});
