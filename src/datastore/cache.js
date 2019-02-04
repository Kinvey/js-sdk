import { Cache } from '../cache';
import { get as getConfig } from '../kinvey/config';
import { isValidTag } from './utils';

export default class DataStoreCache extends Cache {
  constructor(collectionName, tag) {
    const { appKey } = getConfig();

    if (tag && !isValidTag(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(appKey, `${collectionName}.${tag}`);
    } else {
      super(appKey, collectionName);
    }
  }
}
