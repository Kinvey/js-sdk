import assign from 'lodash/assign';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import url from 'url';

import { KinveyError } from 'src/errors';
import { Log, isDefined } from 'src/utils';
import { CacheRequest } from './request';

let sharedInstance = null;

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
export default class Client {
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
  constructor(options = {}) {
    options = assign({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      defaultTimeout: 60000
    }, options);

    this.apiHostname = options.apiHostname;

    if (isString(this.apiHostname) === false) {
      throw new KivneyError('apiHostname must be a string');  
    }
    
    if (/^https?:\/\//i.test(this.apiHostname) === false) {
      this.apiHostname = `https://${this.apiHostname}`;
    }

    const apiHostnameParsed = url.parse(this.apiHostname);
    this.apiProtocol = apiHostnameParsed.protocol;
    this.apiHost = apiHostnameParsed.host;

    this.micHostname = options.micHostname;

    if (isString(this.micHostname) === false) {
      throw new KivneyError('micHostname must be a string');  
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
    this.appKey = options.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = options.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = options.appVersion;

    this.defaultTimeout = options.defaultTimeout;

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
   * Get the active user.
   */
  get activeUser() {
    return CacheRequest.getActiveUser(this);
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
  static initialize(options) {
    const client = new Client(options);
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
  static sharedInstance() {
    if (isDefined(sharedInstance) === false) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return sharedInstance;
  }
}
