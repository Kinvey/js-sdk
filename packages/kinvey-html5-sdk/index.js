import { NetworkRack } from '../../src/request';
import { Html5HttpMiddleware } from '../../src/request/middleware/html5-http';
import { MobileIdentityConnect } from '../../src/identity';
import { Popup } from '../../src/identity/html5-popup';
import pkg from './package.json';

// Setup racks
NetworkRack.useHttpMiddleware(new HttpMiddleware(pkg));

// Setup popup
MobileIdentityConnect.usePopupClass(Popup);

export * from '../../src';
export * from './src';
