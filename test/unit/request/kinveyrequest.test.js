import Request, { KinveyRequest } from '../../../src/request';
import { NotFoundError } from '../../../src/errors';
import { randomString } from '../../../src/utils';
import url from 'url';
import nock from 'nock';
import expect from 'expect';

describe('KinveyRequest', function() {
  describe('constructor', function() {
    it('should be an instance of Request', function() {
      const request = new KinveyRequest();
      expect(request).toBeA(KinveyRequest);
      expect(request).toBeA(Request);
    });
  });

  describe('execute()', function() {
    it('should throw a NotFoundError', function() {
      const kinveyRequestId = randomString();

      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(404, {
          error: 'PathNotFound',
          description: 'The path you tried to access does not exist.'
        }, {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Kinvey-Request-Id': kinveyRequestId
        });

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/foo',
        })
      });
      return request.execute()
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
          expect(error.name).toEqual('NotFoundError');
          expect(error.message).toEqual('The path you tried to access does not exist.');
          expect(error.kinveyRequestId).toEqual(kinveyRequestId);
        });
    });
  });
});
