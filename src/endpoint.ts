import { Promise } from 'es6-promise';
import isString = require('lodash/isString');
import url from 'url';

import { KinveyError } from './errors';
import { Client } from './client';
import { RequestMethod } from './request';
import { KinveyNetworkRequest, AuthType, KinveyRequestOptions } from './request/kinvey';
import { isDefined } from './utils/object';

/**
 * Executes a custom endpoint on the Kinvey backend.
 */
export class CustomEndpoint {
  constructor() {
    throw new KinveyError('Not allowed to create an instance of the `CustomEndpoint` class.',
      'Please use `CustomEndpoint.execute()` function.');
  }
  /**
   * Execute a custom endpoint. A promise will be returned that will be resolved
   * with the result of the command or rejected with an error.
   *
   * @param   {String}          endpoint                          Endpoint to execute.
   * @param   {Object}          [args]                            Command arguments
   * @param   {Object}          [options={}]                      Options
   * @param   {Properties}      [options.properties]              Custom properties to send with
   *                                                              the request.
   * @param   {Number}          [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                           Promise
   *
   * @example
   * var promise = CustomEndpoint.execute('myCustomEndpoint').then(function(data) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static execute(endpoint: string, args?: any, options?: KinveyRequestOptions) {
    const client = options.client || Client.sharedInstance();

    if (isDefined(endpoint) === false) {
      return Promise.reject(new KinveyError('An endpoint argument is required.'));
    }

    if (isString(endpoint) === false) {
      return Promise.reject(new KinveyError('The endpoint argument must be a string.'));
    }

    const request = new KinveyNetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.Default,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/rpc/${client.appKey}/custom/${endpoint}`
      }),
      body: args,
      properties: options.properties,
      timeout: options.timeout,
      client: client
    });
    return request.execute()
      .then(response => response.data);
  }
}
