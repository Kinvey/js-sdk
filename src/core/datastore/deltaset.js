import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import isEmpty from 'lodash/isEmpty';
import { format } from 'url';
import { Query } from '../query';
import { KinveyRequest, RequestMethod, AuthType } from '../request';
import { Client } from '../client';
import { Log } from '../log';
import { repositoryProvider } from './repositories';
import {
  buildCollectionUrl,
  generateEntityId,
  queryCacheCollectionName,
  kinveyRequestStartHeader
} from './utils';

function getCachedQuery(collectionName, query) {
  const queryObject = query ? query.toQueryString() : {};
  const serializedQuery = queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';

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
  const deltaSetQuery = new Query(query);

  if (query && ((isNumber(query.skip) && query.skip > 0) || isNumber(query.limit))) {
    Log.info('The skip and limit modifiers for a query will be ignored when performing a delta set request.');
    deltaSetQuery.skip = 0;
    deltaSetQuery.limit = null;
  }

  return getCachedQuery(collectionName, deltaSetQuery)
    .then((cachedQuery) => {
      let promise;

      if (cachedQuery && cachedQuery.lastRequest) {
        promise = makeDeltaSetRequest(collectionName, cachedQuery.lastRequest, deltaSetQuery, options);
      } else {
        promise = makeRegularGETRequest(collectionName, deltaSetQuery, options);
      }

      return promise
        .then((response) => {
          const requestStartDate = response.headers.get(kinveyRequestStartHeader);
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
