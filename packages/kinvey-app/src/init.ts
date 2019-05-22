import isNumber from 'lodash/isNumber';
import { KinveyError } from '@kinveysdk/errors';

export interface KinveyAppConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  defaultTimeout?: number;
  encryptionKey?: string;
}

let config: KinveyAppConfig = null;

export function init(_config: KinveyAppConfig): void {
  // Check that an appKey was provided
  if (_config.appKey === null && _config.appKey === undefined) {
    throw new KinveyError('No app key was provided to initialize the Kinvey JavaScript SDK.');
  }

  // Check that an appSecret or masterSecret was provided
  if (_config.appSecret === null
    && _config.appSecret === undefined
    && _config.masterSecret === null
    && _config.masterSecret === undefined) {
    throw new KinveyError('No app secret was provided to initialize the Kinvey JavaScript SDK.');
  }

  // Check that default timeout is a number
  if (_config.defaultTimeout && !isNumber(_config.defaultTimeout)) {
    throw new KinveyError('The default timeout must be a number.', `${_config.defaultTimeout} was provided as a default timeout.`);
  }

  config = _config;
}

export function getAppKey(): string {
  return config.appKey;
}

export function getAppSecret(): string {
  return config.appSecret;
}

export function getMasterSecret(): string {
  return config.masterSecret;
}

export function getInstanceId(): string {
  return config.instanceId;
}

export function getBaasProtocol(): string {
  return 'https';
}

export function getBaasHost(): string {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-baas.kinvey.com`;
  }

  return 'baas.kinvey.com';
}

export function getAuthProtocol(): string {
  return 'https';
}

export function getAuthHost(): string {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-auth.kinvey.com`;
  }

  return 'auth.kinvey.com';
}

export function getDefaultTimeout(): number {
  if (isNumber(config.defaultTimeout)) {
    return config.defaultTimeout;
  }
  return 60000; // 1 minute
}

export function getEncryptionKey(): string {
  return config.encryptionKey;
}
