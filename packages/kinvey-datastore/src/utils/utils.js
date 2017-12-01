import KinveyObservable from 'kinvey-utils';
import { Metadata } from 'kinvey-metadata';
import Client from 'kinvey-client';

export function buildCollectionUrl(collectionName, id) {
  let result = `appdata/${Client.sharedInstance().appKey}/${collectionName}`;
  if (id) {
    result += `/${id}`;
  }
  return result;
}

export function wrapInObservable(promiseGenerator, completeAfter = true) {
  const stream = KinveyObservable.create((observer) => {
    promiseGenerator(observer)
      .then(() => {
        if (completeAfter) {
          observer.complete();
        }
      })
      .catch(err => observer.error(err));
  });

  return stream;
}

export function wrapInPromise(value) {
  if (value && typeof value.then === 'function') {
    return value;
  }

  return Promise.resolve(value);
}

export function ensureArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

export function noop() { }

export function generateEntityId(length = 24) {
  const chars = 'abcdef0123456789';
  let objectId = '';

  for (let i = 0, j = chars.length; i < length; i += 1) {
    const pos = Math.floor(Math.random() * j);
    objectId += chars.substring(pos, pos + 1);
  }

  return objectId;
}

export function isNotEmpty(object) {
  return !!object && (object.length > 0 || Object.keys(object).length > 0);
}

export function isEmpty(object) {
  return !isNotEmpty(object);
}

export function isLocalEntity(entity) {
  const metadata = new Metadata(entity);
  return metadata.isLocal();
}

export function resolveWith(promise, result) {
  return promise.then(() => result);
}
