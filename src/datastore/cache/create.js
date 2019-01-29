import isArray from 'lodash/isArray';
import KinveyError from '../../errors/kinvey';
import DataStoreCache from './datastoreCache';

export default async function create(collectionName, tag, doc) {
  if (isArray(doc)) {
    throw new KinveyError('Unable to create an array of entities.', 'Please create entities one by one.');
  }

  const cache = new DataStoreCache(this.collectionName, this.tag);
  const sync = new Sync(this.collectionName, this.tag);
  const cachedDoc = await cache.save(doc);
  await sync.addCreateSyncEvent(cachedDoc);
  return cachedDoc;
}
