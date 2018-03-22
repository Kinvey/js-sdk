import isArray from 'lodash/isArray';
import { format } from 'url';
import { Query } from '../query';
import { KinveyRequest, RequestMethod, AuthType } from '../request';
import { Client } from '../client';
import { KinveyError } from '../errors';
import { repositoryProvider } from './repositories';
import {
  buildCollectionUrl,
  generateEntityId,
  queryCacheCollectionName,
  xKivneyRequestStartHeader
} from './utils';

function getCachedQuery(collectionName, query) {
  const serializedQuery = query ? query.toString() : '';

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const queryCacheQuery = new Query()
        .equalTo('collectionName', collectionName)
        .and()
        .equalTo('query', serializedQuery);
      return offlineRepo.read(queryCacheCollectionName, queryCacheQuery)
        .then((cachedQueries = []) => {
          if (cachedQueries.length > 0) {
            return cachedQueries[0];
          }

          return {
            _id: generateEntityId(),
            collectionName: collectionName,
            query: serializedQuery
          };
        });
    });
}

function updateCachedQuery(cachedQuery, lastRequest) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      cachedQuery.lastRequest = lastRequest;
      return offlineRepo.update(queryCacheCollectionName, cachedQuery);
    });
}

function readEntities(collectionName, query) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      return offlineRepo.read(collectionName, query);
    });
}

function entitiesToDelete(collectionName, deleted = []) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      if (isArray(deleted) && deleted.length > 0) {
        const deletedIds = deleted.map((entities) => entities._id);
        const deleteQuery = new Query().contains('_id', deletedIds);
        return offlineRepo.delete(collectionName, deleteQuery);
      }

      return 0;
    });
}

function entitiesToUpdate(collectionName, changed = []) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      if (isArray(changed) && changed.length > 0) {
        return offlineRepo.update(collectionName, changed);
      }

      return changed;
    });
}

function makeDeltaSetRequest(collectionName, since, query, options) {
  const client = Client.sharedInstance();
  const request = new KinveyRequest({
    authType: AuthType.Default,
    method: RequestMethod.GET,
    url: format({
      protocol: client.apiProtocol,
      host: client.apiHost,
      pathname: buildCollectionUrl(collectionName, null, '_deltaset'),
      query: { since }
    }),
    query,
    timeout: options.timeout,
    followRedirect: options.followRedirect,
    cache: options.cache,
    properties: options.properties,
    skipBL: options.skipBL,
    trace: options.trace,
    client
  });
  return request.execute();
}

function makeRegularGETRequest(collectionName, query, options) {
  const client = Client.sharedInstance();
  const request = new KinveyRequest({
    authType: AuthType.Default,
    method: RequestMethod.GET,
    url: format({
      protocol: client.apiProtocol,
      host: client.apiHost,
      pathname: buildCollectionUrl(collectionName)
    }),
    query,
    timeout: options.timeout,
    followRedirect: options.followRedirect,
    cache: options.cache,
    properties: options.properties,
    skipBL: options.skipBL,
    trace: options.trace,
    client
  });
  return request.execute();
}

export function deltaSet(collectionName, query, options) {
  return getCachedQuery(collectionName, query)
    .then((cachedQuery) => {
      let promise;

      if (cachedQuery && cachedQuery.lastRequest) {
        if (query && (query.skip != null || query.limit != null)) {
          return Promise.reject(new KinveyError('You cannot use the skip and limit modifiers on the query when performing a delta set request.'));
        }

        promise = makeDeltaSetRequest(collectionName, cachedQuery.lastRequest, query, options);
      } else {
        promise = makeRegularGETRequest(collectionName, query, options);
      }

      return promise
        .then((response) => {
          const requestStartDate = response.headers.get(xKivneyRequestStartHeader);
          return updateCachedQuery(cachedQuery, requestStartDate).then(() => response.data);
        });
    })
    .then((data) => {
      return entitiesToDelete(collectionName, data.deleted)
        .then(() => entitiesToUpdate(collectionName, data.changed || data))
        .then(() => data);
    })
    .then(() => readEntities(collectionName, query));
}

export function clearDeltaSet(collectionName) {
  const queryCacheQuery = new Query().equalTo('collectionName', collectionName);
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => offlineRepo.delete(queryCacheCollectionName, queryCacheQuery));
}
