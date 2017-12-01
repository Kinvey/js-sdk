import { CacheMiddleware } from './cache';
import { Storage } from './storage';

exports.CacheMiddleware = class Html5CacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}
