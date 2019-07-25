import { NgModule, ModuleWithProviders, APP_INITIALIZER, InjectionToken, Inject, Injectable } from '@angular/core';
import { init as initSDK, KinveySDKConfig } from '../init';

export const KINVEY_SDK_CONFIG_TOKEN = new InjectionToken<KinveySDKConfig>('KinveySDKConfigToken');

@Injectable()
export class InitService {
  config: KinveySDKConfig;

  constructor(@Inject(KINVEY_SDK_CONFIG_TOKEN) config) {
    this.config = config;
  }

  init(): void {
    initSDK(this.config);
  }
}

export function appInitializer(initService: InitService): () => void {
  const fn = (): void => initService.init();
  return fn;
}

export { KinveySDKConfig };

@NgModule()
export class KinveyModule {
  static init(config: KinveySDKConfig): ModuleWithProviders {
    return {
      ngModule: KinveyModule,
      providers: [
        InitService,
        { provide: KINVEY_SDK_CONFIG_TOKEN, useValue: config },
        {
          provide: APP_INITIALIZER,
          useFactory: appInitializer,
          deps: [InitService],
          multi: true
        }
      ]
    };
  }
}
