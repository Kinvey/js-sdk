import url = require('url');
import * as _ from 'lodash';

import { KinveyError } from './errors';
import { isDefined } from './utils/object';
import { Log } from './utils/log';
import { KinveyCacheRequest } from './request/kinvey';

const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 60000;
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
  private _appVersion?: string;
  private _defaultTimeout?: number;

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
    config = _.assign({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
    }, config);

    if (config.apiHostname && _.isString(config.apiHostname)) {
      const apiHostnameParsed = url.parse(config.apiHostname);
      this.apiProtocol = apiHostnameParsed.protocol || 'https:';
      this.apiHost = apiHostnameParsed.host;
    }

    if (config.micHostname && _.isString(config.micHostname)) {
      const micHostnameParsed = url.parse(config.micHostname);
      this.micProtocol = micHostnameParsed.protocol || 'https:';
      this.micHost = micHostnameParsed.host;
    }

    if (config.liveServiceHostname && _.isString(config.liveServiceHostname)) {
      const liveServiceHostnameParsed = url.parse(config.liveServiceHostname);
      this.liveServiceProtocol = liveServiceHostnameParsed.protocol || 'https:';
      this.liveServiceHost = liveServiceHostnameParsed.host;
    }

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

    /**
     * @type {?number}
     */
    this.defaultTimeout = isDefined(config.defaultTimeout) ? config.defaultTimeout : defaultTimeout;
  }

  /**
   * Get the active user.
   */
  get activeUser() {
    return CacheRequest.getActiveUser(this);
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
   * Live Service host name used for streaming data.
   */
  get liveServiceHostname(): string {
    return url.format({
      protocol: this.liveServiceProtocol,
      host: this.liveServiceHost
    });
  }

  /**
   * The version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   */
  get appVersion() {
    return this._appVersion;
  }

  /**
   * Set the version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   *
   * @param  {String} appVersion  App version.
   */
  set appVersion(appVersion) {
    if (appVersion && _.isString(appVersion) === false) {
      appVersion = String(appVersion);
    }

    this._appVersion = appVersion;
  }

  get defaultTimeout() {
    return this._defaultTimeout;
  }

  set defaultTimeout(timeout: number) {
    if (_.isNumber(timeout) === false || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    if (timeout < 0) {
      Log.info(`Default timeout is less than 0. Setting default timeout to ${defaultTimeout}ms.`);
      timeout = defaultTimeout;
    }

    this._defaultTimeout = timeout;
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
      liveServiceHostname: this.liveServiceHostname,
      liveServiceHost: this.liveServiceHost,
      liveServiceProtocol: this.liveServiceProtocol,
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
