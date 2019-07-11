import { init } from '../src/init';
import { register as registerHttp } from './http';
import { register as registerStorage } from './storage';
import { appKey, appSecret } from './env';

// Register HTTP adapter
registerHttp();

// Register storage adapter
registerStorage();

// Initialize the SDK
init({
  appKey,
  appSecret
});
