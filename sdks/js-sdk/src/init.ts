import { init as sdkInit, KinveySDKConfig } from '@progresskinvey/js-sdk-init';
import { setHttpAdapter, setSessionStore } from '@progresskinvey/js-sdk-http';
import * as httpAdapter from './httpAdapter';
import * as sessionStore from './sessionStore';

export function init(config: KinveySDKConfig) {
  setHttpAdapter(httpAdapter);
  setSessionStore(sessionStore);
  sdkInit(config);
}
