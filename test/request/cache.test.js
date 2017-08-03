import expect from 'expect';
import { Request, CacheRequest } from 'src/request';

describe('CacheRequest', function() {
  describe('constructor', function() {
    it('should be an instance of Request', function() {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });
});
