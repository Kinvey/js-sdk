/* eslint spaced-comment: "off" */
/* eslint func-names: "off" */
/* eslint no-undef: "off" */
/* eslint @typescript-eslint/explicit-function-return-type: "off" */
/* eslint import/no-extraneous-dependencies: "off" */

/// <reference types="mocha" />

import { expect } from 'chai';
import { HttpHeaders } from '../src/headers';

describe('Headers', function () {
  it('should set a header using a function', function() {
    const headers = new HttpHeaders();
    const header = 'foo';
    const value = 'bar';
    headers.set(header, (): string => value);
    expect(headers.get(header)).to.equal(value);
  });
});
