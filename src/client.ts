import url = require('url');
import assign = require('lodash/assign');
import isString = require('lodash/isString');
import isNumber = require('lodash/isNumber');

import { KinveyError } from './errors/kinvey';
import { isDefined } from './utils/object';
import { Log } from './utils/log';

const defaultTimeout = 60000;
let sharedInstance = null;

export interface ClientConfig {
  apiHostname?: string;
  micHostname?: string;
  liveServiceHostname?: string;
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
  apiHostname: string;
  apiProtocol: string;
  apiHost: string;
  micHostname: string;
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

    // Check that an appKey or appId was provided
    if (isDefined(config.appKey) === false) {
      throw new KinveyError('No App Key was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    // Check that an appSecret or masterSecret was provided
    if (isDefined(config.appSecret) === false && isDefined(config.masterSecret) === false) {
      throw new KinveyError('No App Secret or Master Secret was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    this.apiHostname = config.apiHostname;

    if (isString(this.apiHostname) === false) {
      throw new KinveyError('apiHostname must be a string');
    }

    if (/^https?:\/\//i.test(this.apiHostname) === false) {
      this.apiHostname = `https://${this.apiHostname}`;
    }

    const apiHostnameParsed = url.parse(this.apiHostname);
    this.apiProtocol = apiHostnameParsed.protocol;
    this.apiHost = apiHostnameParsed.host;

    this.micHostname = config.micHostname;

    if (isString(this.micHostname) === false) {
      throw new KinveyError('micHostname must be a string');
    }

    if (/^https?:\/\//i.test(this.micHostname) === false) {
      this.micHostname = `https://${this.micHostname}`;
    }

    const micHostnameParsed = url.parse(this.micHostname);
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

    this.defaultTimeout = config.defaultTimeout;

    if (isNumber(this.defaultTimeout) === false || isNaN(this.defaultTimeout)) {
      throw new KinveyError('Invalid default timeout. Default timeout must be a number.');
    }

    if (this.defaultTimeout < 0) {
      Log.info('Default timeout is less than 0. Setting default timeout to 60000ms.');
      this.defaultTimeout = 60000;
    }

    // Freeze this client instance
    Object.freeze(this);
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
  static initialize() {
    throw new KinveyError('Please use Client.init().');
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
  static init(options) {
    const client = new Client(options);
    sharedInstance = client;
    return client;
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
