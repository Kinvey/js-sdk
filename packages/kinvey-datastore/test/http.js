const httpRequest = require('request');
const { Middleware } = require('kinvey-request');
const { isDefined } = require('kinvey-utils/object');
const { NoNetworkConnectionError, TimeoutError } = require('kinvey-errors');
const pkg = require('../package.json');

function deviceInformation() {
  const platform = process.title;
  const version = process.version;
  const manufacturer = process.platform;

  // Return the device information string.
  const parts = [`js-${pkg.name}/${pkg.version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

exports.HttpMiddleware = class HttpMiddleware extends Middleware {
  constructor(name = 'Http Middleware') {
    super(name);
  }

  get deviceInformation() {
    return deviceInformation();
  }

  handle(request) {
    if (!request.url) {
      console.log('>>>>>>>>> ', new Error().stack)
    }
    
    const promise = new Promise((resolve, reject) => {
      const { url, method, headers, body, timeout, followRedirect } = request;

      // Add the X-Kinvey-Device-Information header
      headers['X-Kinvey-Device-Information'] = this.deviceInformation;

      httpRequest({
        method: method,
        url: url,
        headers: headers,
        body: body,
        followRedirect: followRedirect,
        timeout: timeout
      }, (error, response, body) => {
        if (isDefined(response) === false) {
          if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT') {
            return reject(new TimeoutError('The network request timed out.'));
          } else if (error.code === 'ENOENT') {
            return reject(new NoNetworkConnectionError('You do not have a network connection.'));
          }

          return reject(error);
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
    return Promise.resolve();
  }
}
