export * from '../../src';
import { MobileIdentityConnect } from '../../src/identity';
import { NetworkRack } from '../../src/request';
import { NodeHttpMiddleware } from '../../src/request/middleware/node-http';
import pkg from './package.json';

// Setup racks
NetworkRack.useHttpMiddleware(new NodeHttpMiddleware(pkg));
