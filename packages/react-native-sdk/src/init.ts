import { init as initSdk, KinveyAppConfig } from 'kinvey-js-sdk/lib/init';
import { register as registerHttp } from './http';

export {
  KinveyAppConfig
} from 'kinvey-js-sdk/lib/init';

export function init(config: KinveyAppConfig): void{
  registerHttp();
  initSdk(config);
}
