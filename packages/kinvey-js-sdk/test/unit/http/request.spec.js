import { expect } from 'chai';
import Request from '../../../src/http/request';

describe('Request', () => {
  it('should set a timeout', () => {
    const timeout = 10;
    const request = new Request({ timeout });
    expect(request.timeout).to.equal(timeout);
  });
});