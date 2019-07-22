import { expect } from 'chai';
import { HttpHeaders } from '../../src/http/headers';

describe('Headers', function() {
  it('should set a header using a function', function() {
    const headers = new HttpHeaders();
    const header = 'foo';
    const value = 'bar';
    headers.set(header, (): string => value);
    expect(headers.get(header)).to.equal(value);
  });
});
