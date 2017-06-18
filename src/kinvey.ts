import { Promise } from 'es6-promise';
import url = require('url');

import { Client, ClientConfig } from './client';
import { isDefined } from './utils/object';
import { KinveyError } from './errors';
import { AuthType, KinveyNetworkRequest } from './request/kinvey';
import { RequestMethod } from './request';

/**
 * The Kinvey class is used as the entry point for the Kinvey JavaScript SDK.
 */
export const Kinvey = {
  /**
   * Returns the shared instance of the Client class used by the SDK.
   *
   * @throws {KinveyError} If a shared instance does not exist.
   *
   * @return {Client} The shared instance.
   *
   * @example
   * var client = Kinvey.client;
   */
  get client(): Client {
    return Client.sharedInstance();
  },

  /**
   * Initializes the SDK with your app's information. The SDK is initialized when the returned
   * promise resolves.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Promise}                                                     A promise.
   *
   * @throws  {KinveyError}  If an `options.appKey` is not provided.
   * @throws  {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   */
  initialize() {
    throw new KinveyError('Please use Kinvey.init().');
  },

  /**
   * Initializes the SDK with your app's information. The SDK is initialized when the returned
   * promise resolves.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Promise}                                                     A promise.
   *
   * @throws  {KinveyError}  If an `options.appKey` is not provided.
   * @throws  {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   */
  init(config: ClientConfig): Client {
    return Client.init(config);
  },

  /**
   * Pings the Kinvey API service.
   *
   * @returns {Promise<Object>} The response from the ping request.
   */
  ping(client = Client.sharedInstance()): Promise<any> {
    const request = new KinveyNetworkRequest({
      method: RequestMethod.GET,
      authType: AuthType.All,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/appdata/${this.client.appKey}`
      }),
      client: client
    });

    return request.execute()
      .then(response => response.data);
  }
};