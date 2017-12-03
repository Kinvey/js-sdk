import { MobileIdentityConnect} from '../../src/core/identity';
import { NetworkRack, CacheRack } from '../../src/core/request';
import { CacheMiddleware } from '../../src/nativescript/cache';
import { HttpMiddleware } from '../../src/nativescript/http';
import { Popup } from '../../src/nativescript/popup';
import { Push } from '../../src/nativescript/push';
import pkg from './package.json';

// Setup racks
CacheRack.useCacheMiddleware(new CacheMiddleware());
NetworkRack.useHttpMiddleware(new HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

export * from '../../src/core';
export * from '../../src/nativescript';
