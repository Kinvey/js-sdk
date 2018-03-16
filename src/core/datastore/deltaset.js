import isArray from 'lodash/isArray';
import { format } from 'url';
import { Query } from '../query';
import { KinveyRequest, RequestMethod, AuthType } from '../request';
import { Client } from '../client';
import { KinveyError } from '../errors';
import { repositoryProvider } from './repositories';
import { buildCollectionUrl } from './repositories/utils';
import {
  stripTagFromCollectionName,
  generateEntityId,
  queryCacheCollectionName,
  xKivneyRequestStartHeader
} from './utils';

function getDeltaSetQuery(collectionNameWithTag, query) {
  const serializedQuery = query ? query.toString() : '';

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const queryCacheQuery = new Query()
        .equalTo('collectionName', collectionNameWithTag)
        .and()
        .equalTo('query', serializedQuery);
      return offlineRepo.read(queryCacheCollectionName, queryCacheQuery)
        .then((deltaSetQueryDocs = []) => {
          if (deltaSetQueryDocs.length > 0) {
            return deltaSetQueryDocs[0];
          }

          return {
            _id: generateEntityId(),
            collectionName: collectionNameWithTag,
            query: serializedQuery
          };
        });
    });
}

function updateDeltaSetQuery(deltaSetQuery, response) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      deltaSetQuery.lastRequest = response.headers.get(xKivneyRequestStartHeader);
      return offlineRepo.update(queryCacheCollectionName, deltaSetQuery);
    });
}

function readDocs(collectionNameWithTag, query) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      return offlineRepo.read(collectionNameWithTag, query);
    });
}

function deleteDocs(collectionNameWithTag, deleted = []) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      if (isArray(deleted) && deleted.length > 0) {
        const deletedIds = deleted.map((doc) => doc._id);
        const deleteQuery = new Query().contains('_id', deletedIds);
        return offlineRepo.delete(collectionNameWithTag, deleteQuery)
      }

      return deleted;
    });
}

function updateDocs(collectionNameWithTag, changed = []) {
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      if (isArray(changed) && changed.length > 0) {
        return offlineRepo.update(collectionNameWithTag, changed)
      }

      return changed;
    });
}

function makeDeltaSetRequest(collectionNameWithTag, deltaSetQuery, query, options) {
  const collectionName = stripTagFromCollectionName(collectionNameWithTag);
  const client = Client.sharedInstance();
  const request = new KinveyRequest({
    authType: AuthType.Default,
    method: RequestMethod.GET,
    url: format({
      protocol: client.apiProtocol,
      host: client.apiHost,
      pathname: buildCollectionUrl(collectionName, '_deltaset'),
      query: { since: deltaSetQuery.lastRequest }
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

  return request.execute()
    .then((response) => {
      return updateDeltaSetQuery(deltaSetQuery, response).then(() => response.data);
    })
    .then((data) => {
      return deleteDocs(collectionNameWithTag, data.deleted)
        .then(() => updateDocs(collectionNameWithTag, data.changed))
        .then(() => data);
    });
}

function makeRequest(collectionNameWithTag, deltaSetQuery, query, options) {
  if (deltaSetQuery && deltaSetQuery.lastRequest) {
    if (query && (query.skip != null || query.limit != null)) {
      throw new KinveyError('You cannot use the skip and limit modifiers on the query when performing a delta set request.');
    }

    return makeDeltaSetRequest(collectionNameWithTag, deltaSetQuery, query, options);
  }

  const collectionName = stripTagFromCollectionName(collectionNameWithTag);
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
  return request.execute()
    .then((response) => {
      return updateDeltaSetQuery(deltaSetQuery, response).then(() => response.data);
    })
    .then((data) => {
      return updateDocs(collectionNameWithTag, data);
    });
}

export function deltaSet(collectionNameWithTag, query, options) {
  return getDeltaSetQuery(collectionNameWithTag, query)
    .then((deltaSetQuery) => makeRequest(collectionNameWithTag, deltaSetQuery, query, options))
    .then(() => readDocs(collectionNameWithTag, query))
}

export function clearDeltaSet(collectionNameWithTag) {
  const queryCacheQuery = new Query().equalTo('collectionName', collectionNameWithTag);
  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => offlineRepo.delete(queryCacheCollectionName, queryCacheQuery));
}
