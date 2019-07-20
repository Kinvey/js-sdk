import { init } from '../src/init';
import { register as registerHttp } from './http';
import { register as registerStorage } from './storage';
import { APP_KEY, APP_SECRET } from './env';

before(function() {
  // Register HTTP adapter
  registerHttp();

  // Register storage adapter
  registerStorage();

  // Initialize the SDK
  init({
    appKey: APP_KEY,
    appSecret: APP_SECRET
  });
});
