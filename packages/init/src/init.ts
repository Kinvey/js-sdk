import logger from '@progresskinvey/js-sdk-log';
import {
  KinveySDKConfig,
  setAppKey,
  setAppSecret,
  setMasterSecret,
  setInstanceId,
  setDefaultTimeout,
  setEncryptionKey,
  setApiVersion,
} from './kinvey';

export function init(sdkConfig: KinveySDKConfig): void {
  // Check that an appKey was provided
  if (sdkConfig.appKey === null || sdkConfig.appKey === undefined) {
    throw new Error('No app key was provided to initialize the Kinvey JavaScript SDK.');
  }

  // Check that an appSecret or masterSecret was provided
  if (sdkConfig.appSecret === null || sdkConfig.appSecret === undefined) {
    throw new Error('No app secret was provided to initialize the Kinvey JavaScript SDK.');
  }

  setAppKey(sdkConfig.appKey);
  setAppSecret(sdkConfig.appSecret);

  if (sdkConfig.masterSecret) {
    logger.warn('We recommend that you do not use the master secret on a client. This is a potential security risk.');
    setMasterSecret(sdkConfig.masterSecret);
  }

  if (sdkConfig.instanceId) {
    setInstanceId(sdkConfig.instanceId);
  }

  if (sdkConfig.defaultTimeout) {
    setDefaultTimeout(sdkConfig.defaultTimeout);
  }

  if (sdkConfig.encryptionKey) {
    setEncryptionKey(sdkConfig.encryptionKey);
  }

  if (sdkConfig.apiVersion) {
    setApiVersion(sdkConfig.apiVersion);
  }
}
