import { CacheMiddleware } from '../html5/cache';
import { Storage } from './storage';

export class CacheMiddleware extends Html5CacheMiddleware {
  loadStorage(name, storageProviders, encryptionKey) {
    return new Storage(name, storageProviders, encryptionKey);
  }
}
