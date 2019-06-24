import { init as coreInit } from 'kinvey-js-sdk';
import * as HttpAdapter from './httpAdapter';

export interface KinveyConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  storage?: any;
}
export function init(config: KinveyConfig) {
  const kinveyConfig = coreInit({
    kinveyConfig: config,
    httpAdapter: HttpAdapter,
    sessionStore: null,
    popup: null,
    storageAdapter: null,
    pubnub: null
  })
  return Object.assign({}, kinveyConfig, { storage: config.storage, _storage: config.storage });
}

export function initialize(config: KinveyConfig) {
  return init(config);
}
