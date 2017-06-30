import expect = require('expect');
import nock = require('nock');

import { execute } from '../src/endpoint';
import { KinveyError, NotFoundError } from '../src/errors';
import { Client } from '../src/client';

describe('Endpoint', () => {
  describe('execute()', () => {
    it('should throw a KinveyError when an endpoint argument is not provided', () => {
      return execute()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError when the endpoint argument is not a string', () => {
      return execute({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw NotFoundError for a custom endpoint that does not exist', () => {
      const client = Client.sharedInstance();

      nock(client.apiHostname)
        .post(`/rpc/${client.appKey}/custom/doesnotexist`)
        .reply(404, {
          error: 'EndpointDoesNotExist',
          description: 'The custom endpoint you tried to access does not exist.'
            + ' Please configure custom Business Logic endpoints through the Kinvey Console.',
          debug: ''
        });

      return execute('doesnotexist')
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should execute a custom endpoint and return the response', () => {
      const client = Client.sharedInstance();
      const response = { message: 'Hello, World!' };

      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${client.appKey}/custom/test`)
        .reply(200, response);

      return execute('test')
        .then((response) => {
          expect(response).toEqual(response);
        });
    });

    it('should execute a custom endpoint with args and return the response', () => {
      const client = Client.sharedInstance();
      const args = { message: 'Hello, Tests!' };

      nock(client.apiHostname)
        .post(`/rpc/${client.appKey}/custom/test`)
        .reply(200, args);

      return execute('test', args)
        .then((response) => {
          expect(response).toEqual(args);
        });
    });
  });
});