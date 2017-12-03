import { NetworkRack, CacheRack } from '../../src/core/request';
import { Html5HttpMiddleware } from '../../src/html5/http';
import { Html5CacheMiddleware } from '../../src/html5/cache';
import { MobileIdentityConnect } from '../../src/core/identity';
import { Popup } from '../../src/phonegap/popup';
import { Push } from '../../src/phonegap/push';
import pkg from './package.json';

// Setup racks
CacheRack.useCacheMiddleware(new Html5CacheMiddleware());
NetworkRack.useHttpMiddleware(new Html5HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

export * from '../../src/core';
export * from '../../src/html5';
export { Push };
