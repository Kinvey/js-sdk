import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';

export interface KinveySDKConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  defaultTimeout?: number;
  encryptionKey?: string;
  apiVersion?: number;
}

const config: KinveySDKConfig = {
  appKey: '',
  appSecret: '',
  defaultTimeout: 60000, // 1 minute
  apiVersion: 4,
};

export function getAppKey(): string {
  if (isEmpty(config.appKey)) {
    throw new Error('An appKey has not been set. Please initialize the SDK.');
  }
  return config.appKey;
}

export function setAppKey(appKey: string): void {
  if (!isString(appKey)) {
    throw new Error('The appKey must be a string.');
  }
  config.appKey = appKey;
}

export function getAppSecret(): string {
  if (isEmpty(config.appSecret)) {
    throw new Error('An appSecret has not been set. Please initialize the SDK.');
  }
  return config.appSecret;
}

export function setAppSecret(appSecret: string): void {
  if (!isString(appSecret)) {
    throw new Error('The appSecret must be a string.');
  }
  config.appSecret = appSecret;
}

export function getMasterSecret(): string {
  if (isEmpty(config.masterSecret)) {
    throw new Error('An masterSecret has not been set.');
  }
  return config.masterSecret;
}

export function setMasterSecret(masterSecret: string): void {
  if (!isString(masterSecret)) {
    throw new Error('The masterSecret must be a string.');
  }
  config.masterSecret = masterSecret;
}

export function getInstanceId(): string | undefined {
  return config.instanceId;
}

export function setInstanceId(instanceId: string): void {
  if (!isString(instanceId)) {
    throw new Error('The instanceId must be a string.');
  }
  config.instanceId = instanceId;
}

export function removeInstanceId(): void {
  config.instanceId = undefined;
}

export function getDefaultTimeout(): number {
  return config.defaultTimeout;
}

export function setDefaultTimeout(timeout: number): void {
  if (!isNumber(timeout)) {
    throw new Error('The default timeout must be a number and should be expressed in ms.');
  }
  config.defaultTimeout = timeout;
}

export function getEncryptionKey(): string | undefined {
  return config.encryptionKey;
}

export function setEncryptionKey(encryptionKey: string): void {
  if (!isString(encryptionKey)) {
    throw new Error('The encryptionKey must be a string.');
  }
  config.encryptionKey = encryptionKey;
}

export function getApiVersion(): number {
  return config.apiVersion;
}

export function setApiVersion(version: number): void {
  if (!isNumber(version)) {
    throw new Error('The api version must be a number.');
  }
  config.apiVersion = version;
}
