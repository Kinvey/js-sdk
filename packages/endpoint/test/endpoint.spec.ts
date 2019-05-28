/* eslint func-names: "off" */
/* eslint no-undef: "off" */
/* eslint @typescript-eslint/explicit-function-return-type: "off" */
/* eslint import/no-extraneous-dependencies: "off" */

import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { KinveyError } from '@kinveysdk/errors';
import { kinveyAppAuth, formatKinveyBaasUrl, KinveyBaasNamespace, kinveySessionAuth } from '@kinveysdk/http';
import { init } from '@kinveysdk/app';
import { register as registerHttp } from '@kinveysdk/http-node';
import { setSession, removeSession } from '@kinveysdk/session';
import { endpoint } from '../src/endpoint';

describe('Endpoint', function () {
  const appKey = 'appKey';
  const appSecret = 'appSecret';

  before(function() {
    registerHttp();
  });

  before(function() {
    init({
      appKey,
      appSecret
    });
  });

  it('should throw an error if an endpoint is not provided', async function () {
    try {
      // @ts-ignore
      await endpoint();
      throw new Error('Expected an error to be thrown.');
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('You must provide an endpoint as a string.');
    }
  });

  it('should throw an error if the provided endpoint is not a string', async function () {
    try {
      // @ts-ignore
      await endpoint({});
      throw new Error('Expected an error to be thrown.');
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
      expect(error.message).to.equal('You must provide an endpoint as a string.');
    }
  });

  it('should authorize the request with the appKey and appSecret', async function() {
    const endpointPath = 'kinvey';
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`));
    const scope = nock(url.origin, {
      reqheaders: {
        'Authorization': kinveyAppAuth()
      }
    })
      .post(url.pathname)
      .reply(200, {}, {
        'Content-Type': 'application/json'
      });
    const response = await endpoint(endpointPath);
    expect(response).to.deep.equal({});
    expect(scope.isDone()).to.equal(true);
  });

  it('should authorize the request with the active session', async function () {
    setSession({
      _id: '1',
      _kmd: {
        authtoken: 'authtoken'
      }
    });

    const endpointPath = 'kinvey';
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`));
    const scope = nock(url.origin, {
      reqheaders: {
        'Authorization': kinveySessionAuth()
      }
    })
      .post(url.pathname)
      .reply(200, {}, {
        'Content-Type': 'application/json'
      });
    const response = await endpoint(endpointPath);
    expect(response).to.deep.equal({});
    expect(scope.isDone()).to.equal(true);

    removeSession();
  });

  it('should send arguments to the endpoint', async function () {
    const endpointPath = 'kinvey';
    const args = { foo: 'bar' };
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`));
    const scope = nock(url.origin)
      .post(url.pathname, args)
      .reply(200, {}, {
        'Content-Type': 'application/json'
      });
    const response = await endpoint(endpointPath, args);
    expect(response).to.deep.equal({});
    expect(scope.isDone()).to.equal(true);
  });

  it('should return the response from the endpoint', async function () {
    const endpointPath = 'kinvey';
    const endpointResponse = { foo: 'bar' };
    const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.Rpc, `/custom/${endpointPath}`));
    const scope = nock(url.origin)
      .post(url.pathname)
      .reply(200, endpointResponse, {
        'Content-Type': 'application/json'
      });
    const response = await endpoint(endpointPath);
    expect(response).to.deep.equal(endpointResponse);
    expect(scope.isDone()).to.equal(true);
  });
});
