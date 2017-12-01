import { KinveyRequest, RequestMethod, DeltaFetchRequest } from 'kinvey-request';

import { Repository } from './repository';
import { buildCollectionUrl, ensureArray } from '../utils';

/**
 * @typedef RequestOptions
 * @property {Operation} operation
 * @property {Object} options
 * @property {Query} [options.query]
 * @property {Query} [options.query]
 * @property {Object} [options.aggregation]
 * @property {Number} [options.timeout]
 * @property {Object} [options.properties]
 * @property {Boolean} [options.skipBL]
 * @property {Boolean} [options.trace]
 */

export class NetworkRepository extends Repository {
  read(collection, query, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, query, null, options = {});
    return this._makeHttpRequest(requestConfig, options.useDeltaFetch);
  }

  readById(collection, entityId, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, null, entityId, options);
    return this._makeHttpRequest(requestConfig);
  }

  create(collection, entities, options) {
    return this._processBatch(collection, RequestMethod.POST, entities, null, options);
  }

  update(collection, entities, options) {
    return this._processBatch(collection, RequestMethod.PUT, entities, options);
  }

  deleteById(collection, entityId, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.DELETE, null, null, entityId, options);
    return this._makeHttpRequest(requestConfig);
  }

  delete(collection, query, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.DELETE, null, query, null, options);
    return this._makeHttpRequest(requestConfig);
  }

  count(collection, query, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, query, '_count', options);
    return this._makeHttpRequest(requestConfig);
  }

  _processBatch(collection, method, entities, options) {
    const isSingle = !Array.isArray(entities);
    const requestPromises = ensureArray(entities).map((entity) => {
      const id = method === RequestMethod.PUT ? entity._id : null; // TODO: this isn't great :)
      const requestConfig = this._buildRequestConfig(collection, method, entity, null, id, options);
      return this._makeHttpRequest(requestConfig);
    });
    // TODO: different error handling?
    return Promise.all(requestPromises)
      .then(res => (isSingle ? res && res[0] : res));
  }

  _makeHttpRequest(requestConfig, deltaFetch) {
    if (deltaFetch) { // TODO: maybe this needs to be in sync manager
      const request = new DeltaFetchRequest(requestConfig);
      return request.execute().then(r => r.data);
    }
    return KinveyRequest.execute(requestConfig);
  }

  /**
   * @param {String} collection
   * @param {Object} query
   * @param {RequestOptions} options
   * @param {RequestMethod} method
   * @param {Objet} data
   * @returns {RequestOptions}
   */
  _buildRequestConfig(collection, method, data, query, idOrRestAction, options) {
    options = options || {};
    const config = {
      method,
      pathname: buildCollectionUrl(collection, idOrRestAction),
      query: query,
      timeout: options.timeout,
      properties: options.properties,
      trace: options.trace,
      skipBL: options.skipBL
    };

    if (data) {
      config.body = data;
    }

    return config;
  }
}
