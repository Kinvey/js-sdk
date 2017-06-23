import xhr = require('xhr');
import isFunction = require('lodash/isFunction');

import { Kinvey } from '../src/kinvey';
import { randomString } from '../src/utils/string';
import { Middleware } from '../src/rack/middleware';
import { isDefined } from '../src/utils/object';
import { TimeoutError, NetworkConnectionError } from '../src/errors';
import { NetworkRack } from '../src/rack';

class HttpMiddleware extends Middleware {
  xhrRequest?: XMLHttpRequest;

  constructor(name = 'Http Middleware') {
    super(name);
  }

  handle(request) {
    const promise = new Promise((resolve, reject) => {
      const { url, method, headers, body, timeout, followRedirect } = request;

      this.xhrRequest = xhr({
        method: method,
        url: url,
        headers: headers,
        body: body,
        followRedirect: followRedirect,
        timeout: timeout
      }, (error, response, body) => {
        if (isDefined(error)) {
          if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT') {
            return reject(new TimeoutError('The network request timed out.'));
          }

          return reject(new NetworkConnectionError('There was an error connecting to the network.', error));
        }

        return resolve({
          response: {
            statusCode: response.statusCode,
            headers: response.headers,
            data: body
          }
        });
      });
    });
    return promise;
  }

  cancel() {
    if (isDefined(this.xhrRequest) && isFunction(this.xhrRequest.abort)) {
      this.xhrRequest.abort();
    }

    return Promise.resolve();
  }
}

// Setup network rack
NetworkRack.useHttpMiddleware(new HttpMiddleware());

// Init Kinvey
beforeAll(function() {
  Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});