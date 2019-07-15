import { init as initSdk, KinveySDKConfig } from 'kinvey-js-sdk/lib/init';
import { register as registerHttp } from './http';

export { KinveySDKConfig };

export function init(config: KinveySDKConfig): void {
  registerHttp();
  initSdk(config);
}
