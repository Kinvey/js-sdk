import url = require('url');
import assign = require('lodash/assign');
import isNumber = require('lodash/isNumber');
import isString = require('lodash/isString');

import { KinveyError } from './errors/kinvey';
import { isDefined } from './utils/object';
import { Log } from './utils/log';
import { KinveyCacheRequest } from './request/kinvey';

let sharedInstance = null;

export interface ClientConfig {
  apiHostname?: string;
  micHostname?: string;
  appKey: string;
  appSecret?: string;
  masterSecret?: string;
  encryptionKey?: string;
  defaultTimeout?: number;
  appVersion?: string;
}

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
export class Client {
  apiProtocol: string;
  apiHost: string;
  micProtocol: string;
  micHost: string;
  appKey: string;
  appSecret?: string;
  masterSecret?: string;
  encryptionKey?: string;
  appVersion?: string;
  defaultTimeout?: number;

  /**
   * Creates a new instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      An instance of the Client class.
   *
   * @example
   * var client = new Kinvey.Client({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   */
  constructor(config: ClientConfig) {
    config = assign({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      defaultTimeout: 60000
    }, config);

    if (isString(config.apiHostname) === false) {
      throw new KinveyError('apiHostname must be a string');
    }

    if (/^https?:\/\//i.test(config.apiHostname) === false) {
      config.apiHostname = `https://${config.apiHostname}`;
    }

    const apiHostnameParsed = url.parse(config.apiHostname);
    this.apiProtocol = apiHostnameParsed.protocol;
    this.apiHost = apiHostnameParsed.host;

    if (isString(config.micHostname) === false) {
      throw new KinveyError('micHostname must be a string');
    }

    if (/^https?:\/\//i.test(this.micHostname) === false) {
      config.micHostname = `https://${config.micHostname}`;
    }

    const micHostnameParsed = url.parse(config.micHostname);
    this.micProtocol = micHostnameParsed.protocol;
    this.micHost = micHostnameParsed.host

    /**
     * @type {?string}
     */
    this.appKey = config.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = config.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = config.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = config.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = config.appVersion;

    if (isNumber(config.defaultTimeout) === false || isNaN(config.defaultTimeout)) {
      throw new KinveyError('Invalid default timeout. Default timeout must be a number.');
    }

    if (config.defaultTimeout < 0) {
      Log.info('Default timeout is less than 0. Setting default timeout to 60000ms.');
      config.defaultTimeout = 60000;
    }

    this.defaultTimeout = config.defaultTimeout;

    // Freeze this client instance
    Object.freeze(this);
  }

  /**
   * API host name used for Kinvey API requests.
   */
  get apiHostname(): string {
    return url.format({
      protocol: this.apiProtocol,
      host: this.apiHost
    });
  }

  /**
   * Mobile Identity Connect host name used for MIC requests.
   */
  get micHostname(): string {
    return url.format({
      protocol: this.micProtocol,
      host: this.micHost
    });
  }

  /**
   * Returns an object containing all the information for this Client.
   *
   * @return {Object} Object
   */
  toPlainObject(): {} {
    return {
      apiHostname: this.apiHostname,
      apiProtocol: this.apiProtocol,
      apiHost: this.apiHost,
      micHostname: this.micHostname,
      micProtocol: this.micProtocol,
      micHost: this.micHost,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey,
      appVersion: this.appVersion
    };
  }

  /**
   * Initializes the Client class by creating a new instance of the
   * Client class and storing it as a shared instance. The returned promise
   * resolves with the shared instance of the Client class.
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
   */
  static initialize(config: ClientConfig) {
    const client = new Client(config);
    sharedInstance = client;
    return CacheRequest.loadActiveUser(client)
      .then(() => client);
  }

  /**
   * Returns the shared instance of the Client class used by the SDK.
   *
   * @throws {KinveyError} If a shared instance does not exist.
   *
   * @return {Client} The shared instance.
   *
   * @example
   * var client = Kinvey.Client.sharedInstance();
   */
  static sharedInstance(): Client {
    if (isDefined(sharedInstance) === false) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return sharedInstance;
  }
}
