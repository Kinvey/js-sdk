import isArray from 'lodash/isArray';
import { format } from 'url';
import { Query } from '../query';
import { KinveyRequest, RequestMethod, AuthType } from '../request';
import { Client } from '../client';
import { repositoryProvider } from './repositories';
import { stripTagFromCollectionName, generateEntityId } from './utils';

const QUERY_CACHE_COLLECTION_NAME = '_QueryCache';

export function deltaSet(collectionNameWithTag, query, options) {
  const collectionName = stripTagFromCollectionName(collectionNameWithTag);
  const serializedQuery = query ? JSON.stringify(query.toQueryString()) : '';

  return repositoryProvider.getOfflineRepository()
    .then((offlineRepo) => {
      const queryCacheQuery = new Query()
        .equalTo('collectionName', collectionName)
        .and()
        .equalTo('query', serializedQuery);
      return offlineRepo.read(QUERY_CACHE_COLLECTION_NAME, queryCacheQuery)
        .then((deltaSetQueryDocs = []) => {
          if (deltaSetQueryDocs.length > 0) {
            return deltaSetQueryDocs[0];
          }

          return {
            _id: generateEntityId(),
            collectionName: collectionName,
            query: serializedQuery
          };
        })
        .then((deltaSetQueryDoc) => {
          const client = Client.sharedInstance();
          let url = format({
            protocol: client.apiProtocol,
            host: client.apiHost,
            pathname: `/appdata/${client.appKey}/${collectionName}`
          });

          if (deltaSetQueryDoc.lastRequest) {
            url = format({
              protocol: client.apiProtocol,
              host: client.apiHost,
              pathname: `/appdata/${client.appKey}/${collectionName}/_deltaset`,
              query: { since: deltaSetQueryDoc.lastRequest }
            });
          }

          const request = new KinveyRequest({
            authType: AuthType.Session,
            method: RequestMethod.GET,
            url,
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
              deltaSetQueryDoc.lastRequest = response.headers.get('X-Kinvey-Request-Start');
              return offlineRepo.update(QUERY_CACHE_COLLECTION_NAME, deltaSetQueryDoc)
                .then((response) => response.data);
            });
        })
        .then((data) => {
          const { deleted } = data;

          if (isArray(deleted) && deleted.length > 0) {
            const deletedIds = deleted.map((doc) => doc._id);
            const deleteQuery = new Query().contains('_id', deletedIds);
            return offlineRepo.delete(collectionNameWithTag, deleteQuery)
              .then(() => data);
          }

          return data;
        })
        .then((data) => {
          let { changed } = data;

          if (!changed) {
            changed = data;
          }

          return offlineRepo.update(collectionNameWithTag, changed);
        });
    });
}
