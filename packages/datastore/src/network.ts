import {
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  KinveyHttpRequest,
  KinveyHttpResponse,
  kinveySessionAuth,
} from '@progresskinvey/js-sdk-http';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';

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

export class DataStoreNetwork {
  public collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  find(query?: Query, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const requestQueryObject = Object.assign(query ? query.toQueryObject() : {}, {
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS,
    });
    const request = new KinveyHttpRequest({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  findByDeltaSet(query?: Query, options: DeltaSetNetworkOptions = {}): Promise<KinveyHttpResponse> {
    if (!options.since) {
      throw new Error('A value for since in the options must be provided.');
    }

    const requestQueryObject = Object.assign(query ? query.toQueryObject() : {}, {
      since: options.since,
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS,
    });
    const request = new KinveyHttpRequest({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/_deltaset`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  findById(id: string, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${id}`, {
        kinveyfile_ttl: options.kinveyFileTTL,
        kinveyfile_tls: options.kinveyFileTLS,
      }),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  count(query?: Query, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'GET',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(
        KinveyBaasNamespace.AppData,
        `/${this.collectionName}/_count`,
        query ? query.toQueryObject() : {}
      ),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  group<T>(aggregation: Aggregation<T>, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'POST',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/_group`),
      body: aggregation.toPlainObject(),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  create(entity: Entity, options?: NetworkOptions): Promise<KinveyHttpResponse>;
  create(entities: Entity[], options?: NetworkOptions): Promise<KinveyHttpResponse>;
  create(entities: any, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'POST',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}`),
      body: entities,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  update(entity: Entity, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    if (!entity._id) {
      throw new Error('The doc provided does not contain an _id. An _id is required to update the doc.');
    }

    const request = new KinveyHttpRequest({
      method: 'PUT',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${entity._id}`),
      body: entity,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  remove(query?: Query, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'DELETE',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(
        KinveyBaasNamespace.AppData,
        `/${this.collectionName}`,
        query ? query.toQueryObject() : {}
      ),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }

  removeById(id: string, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: 'DELETE',
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${id}`),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties,
    });
    return request.execute();
  }
}
