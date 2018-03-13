import { Promise } from 'es6-promise';
import { format } from 'url';

import { KinveyRequest, RequestMethod } from '../../request';
import { Aggregation } from '../../aggregation';

import { Repository } from './repository';
import { ensureArray } from '../../utils';
import { Client } from '../../client';
import { buildCollectionUrl } from './utils';

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
  read(collection, query, options = {}, responseCallback) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, query, null, null, options);
    return this._makeHttpRequest(requestConfig, responseCallback);
  }

  deltaSet(collection, query, since, options = {}, responseCallback) {
    const client = Client.sharedInstance();
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, query, '_deltaset', null, options);
    requestConfig.url = format({
      protocol: client.apiProtocol,
      host: client.apiHost,
      pathname: requestConfig.pathname,
      query: { since }
    });
    delete requestConfig.pathname;
    return this._makeHttpRequest(requestConfig, responseCallback);
  }

  readById(collection, entityId, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, null, entityId, null, options);
    return this._makeHttpRequest(requestConfig);
  }

  create(collection, entities, options) {
    return this._processBatch(collection, RequestMethod.POST, entities, null, options);
  }

  update(collection, entities, options) {
    return this._processBatch(collection, RequestMethod.PUT, entities, options);
  }

  deleteById(collection, entityId, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.DELETE, null, null, entityId, null, options);
    return this._makeHttpRequest(requestConfig)
      .then(response => response.count);
  }

  delete(collection, query, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.DELETE, null, query, null, null, options);
    return this._makeHttpRequest(requestConfig)
      .then(response => response.count);
  }

  count(collection, query, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.GET, null, query, null, '_count', null, options);
    return this._makeHttpRequest(requestConfig)
      .then(response => response.count);
  }

  group(collection, aggregationQuery, options) {
    const requestConfig = this._buildRequestConfig(collection, RequestMethod.POST, null, aggregationQuery, null, '_group', null, options);
    return this._makeHttpRequest(requestConfig);
  }

  _processBatch(collection, method, entities, options) {
    const isSingle = !Array.isArray(entities);
    const requestPromises = ensureArray(entities).map((entity) => {
      const id = method === RequestMethod.PUT ? entity._id : null;
      const requestConfig = this._buildRequestConfig(collection, method, entity, null, id, null, options);
      return this._makeHttpRequest(requestConfig);
    });

    return Promise.all(requestPromises)
      .then(res => (isSingle ? res && res[0] : res));
  }

  _makeHttpRequest(requestConfig, responseCallback) {
    return KinveyRequest.execute(requestConfig, null, false)
      .then((response) => {
        if (typeof responseCallback === 'function') {
          responseCallback(response);
        }

        return response.data;
      });
  }

  /**
   * @param {String} collection
   * @param {Object} query
   * @param {RequestOptions} options
   * @param {RequestMethod} method
   * @param {Objet} data
   * @returns {RequestOptions}
   */
  _buildRequestConfig(collection, method, data, query, id, restAction, options) {
    options = options || {};
    const config = {
      method,
      pathname: buildCollectionUrl(collection, id, restAction),
      timeout: options.timeout,
      properties: options.properties,
      trace: options.trace,
      skipBL: options.skipBL
    };

    if (data) {
      config.body = data;
    }

    if (query instanceof Aggregation) {
      config.aggregation = query;
    } else {
      config.query = query;
    }

    return config;
  }
}
