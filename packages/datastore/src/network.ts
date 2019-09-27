import isArray from 'lodash/isArray';
import times from 'lodash/times';
import {
  formatKinveyBaasUrl,
  KinveyNamespace,
  KinveyHttpRequest,
  KinveyHttpResponse,
  kinveySessionAuth,
  HttpRequestMethod,
} from '@progresskinvey/js-sdk-http';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { getApiVersion } from '@progresskinvey/js-sdk-init';
import urlJoin from 'url-join';

export interface NetworkOptions {
  trace?: boolean;
  skipBL?: boolean;
  properties?: any;
}

export interface FindNetworkOptions extends NetworkOptions {
  kinveyFileTTL?: number;
  kinveyFileTLS?: boolean;
}

export interface DeltaSetNetworkOptions extends FindNetworkOptions {
  since?: string;
}

export interface MultiSaveResult<T extends Entity> {
  entities: T[];
  errors: { index: number; msg: string; debug?: string }[];
}

export class MultiSaveResponse<T extends Entity> extends KinveyHttpResponse {
  data: MultiSaveResult<T>;
}

export class DataStoreNetwork<T extends Entity> {
  public collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  find(query?: Query, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const queryObject = Object.assign(query ? query.toQueryObject() : {}, {
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS,
    });
    const url = this.formatUrl({ query: queryObject });
    return this.sendRequest({ method: 'GET', url, options });
  }

  findByDeltaSet(query?: Query, options: DeltaSetNetworkOptions = {}): Promise<KinveyHttpResponse> {
    if (!options.since) {
      throw new Error('A value for since in the options must be provided.');
    }

    const queryObject = Object.assign(query ? query.toQueryObject() : {}, {
      since: options.since,
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS,
    });
    const url = this.formatUrl({ path: '/_deltaset', query: queryObject });
    return this.sendRequest({ method: 'GET', url, options });
  }

  findById(id: string, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const url = this.formatUrl({
      path: `/${id}`,
      query: {
        kinveyfile_ttl: options.kinveyFileTTL,
        kinveyfile_tls: options.kinveyFileTLS,
      },
    });
    return this.sendRequest({ method: 'GET', url, options });
  }

  count(query?: Query, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const url = this.formatUrl({ path: '/_count', query: query ? query.toQueryObject() : {} });
    return this.sendRequest({ method: 'GET', url, options });
  }

  group<K>(aggregation: Aggregation<K>, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const url = this.formatUrl({ path: '/_group' });
    return this.sendRequest({ method: 'POST', url, body: aggregation.toPlainObject(), options });
  }

  async create(entities: T | T[], options?: NetworkOptions): Promise<KinveyHttpResponse | MultiSaveResponse<T>> {
    if (isArray(entities)) {
      const apiVersion = getApiVersion();

      if (apiVersion < 5) {
        throw new Error(
          `Unable to create an array of entities. You are currently using apiVersion ${apiVersion}. You can only create an array of entities with apiVersion 5+.`
        );
      }

      const batchSize = 100;
      const batchCount = Math.ceil(entities.length / batchSize);
      const batches = times(batchCount, (i) => {
        return entities.slice(i, i + batchSize);
      });
      const responses = await Promise.all(
        batches.map(async (batch) => {
          try {
            const url = this.formatUrl();
            const response = await this.sendRequest({ method: 'POST', url, body: batch, options });
            return response;
          } catch (e) {
            const entities = batch.map(() => null);
            const errors = batch.map((value, index) => ({ index, msg: e.message }));
            return new MultiSaveResponse({
              statusCode: 500,
              headers: {},
              data: { entities, errors },
            });
          }
        })
      );
      return responses.reduce((multiSaveResponse, response) => {
        multiSaveResponse.headers.join(response.headers);
        multiSaveResponse.data.entities.concat(response.data.entities);
        multiSaveResponse.data.errors.concat(response.data.errors);
        return multiSaveResponse;
      }, new MultiSaveResponse({ statusCode: 207 }));
    }

    const url = this.formatUrl();
    return this.sendRequest({ method: 'POST', url, body: entities, options });
  }

  async update(entities: T | T[], options?: NetworkOptions): Promise<KinveyHttpResponse | MultiSaveResponse<T>> {
    if (isArray(entities)) {
      const apiVersion = getApiVersion();

      if (apiVersion < 5) {
        throw new Error(
          `Unable to update an array of entities. You are currently using apiVersion ${apiVersion}. You can only update an array of entities with apiVersion 5+.`
        );
      }

      const responses = await Promise.all(
        entities.map(async (entity, index) => {
          try {
            if (!entity._id) {
              throw new Error('The entity provided does not contain an _id. An _id is required to update the entity.');
            }

            const url = this.formatUrl({ path: `/${entity._id}` });
            const response = await this.sendRequest({ method: 'PUT', url, body: entity, options });
            return new MultiSaveResponse({
              statusCode: response.statusCode,
              headers: response.headers.toPlainObject(),
              data: { entities: [response.data], errors: [] },
            });
          } catch (e) {
            return new MultiSaveResponse({
              statusCode: 500,
              headers: {},
              data: { entities: [null], errors: [{ index, msg: e.message }] },
            });
          }
        })
      );
      return responses.reduce((multiSaveResponse, response) => {
        multiSaveResponse.headers.join(response.headers);
        multiSaveResponse.data.entities.concat(response.data.entities);
        multiSaveResponse.data.errors.concat(response.data.errors);
        return multiSaveResponse;
      }, new MultiSaveResponse({ statusCode: 207 }));
    }

    if (!(entities as T)._id) {
      throw new Error('The entity provided does not contain an _id. An _id is required to update the entity.');
    }

    const url = this.formatUrl({ path: `/${(entities as T)._id}` });
    return this.sendRequest({ method: 'PUT', url, body: entities, options });
  }

  remove(query?: Query, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const url = this.formatUrl({ query: query ? query.toQueryObject() : {} });
    return this.sendRequest({ method: 'DELETE', url, options });
  }

  removeById(id: string, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const url = this.formatUrl({ path: `/${id}` });
    return this.sendRequest({ method: 'DELETE', url, options });
  }

  private formatUrl(options: { path?: string; query?: { [key: string]: any } } = {}): string {
    const { path, query } = options;
    return formatKinveyBaasUrl(
      KinveyNamespace.AppData,
      path ? urlJoin(this.collectionName, path) : this.collectionName,
      query
    );
  }

  private sendRequest(config: {
    method: HttpRequestMethod;
    url: string;
    body?: any;
    options: NetworkOptions;
  }): Promise<KinveyHttpResponse> {
    const { method, url, body, options = {} } = config;
    const request = new KinveyHttpRequest({
      method,
      auth: kinveySessionAuth,
      url,
      body,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }
}
