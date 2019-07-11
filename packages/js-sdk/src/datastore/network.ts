import {
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  KinveyHttpRequest,
  KinveyHttpResponse,
  HttpRequestMethod,
  kinveySessionAuth
} from '../http';
import { Query } from '../query';
import { Doc } from '../storage';
import { KinveyError, ParameterValueOutOfRangeError } from '../errors';

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

  find(query?: Query<Doc>, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const requestQueryObject = Object.assign(query ? query.toHttpQueryObject() : {}, {
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS
    });
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  findByDeltaSet(query?: Query<Doc>, options: DeltaSetNetworkOptions = {}): Promise<KinveyHttpResponse> {
    if (!options.since) {
      throw new ParameterValueOutOfRangeError('A value for since in the options must be provided.');
    }

    const requestQueryObject = Object.assign(query ? query.toHttpQueryObject() : {}, {
      since: options.since,
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS
    });
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/_deltaset`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  findById(id: string, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const requestQueryObject = Object.assign({
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS
    });
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${id}`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  count(query?: Query<Doc>, options: FindNetworkOptions = {}): Promise<KinveyHttpResponse> {
    const requestQueryObject = Object.assign(query ? query.toHttpQueryObject() : {}, {
      kinveyfile_ttl: options.kinveyFileTTL,
      kinveyfile_tls: options.kinveyFileTLS
    });
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.GET,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/_count`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  create(doc: Doc, options?: NetworkOptions): Promise<KinveyHttpResponse>;
  create(docs: Doc[], options?: NetworkOptions): Promise<KinveyHttpResponse>;
  create(docs: any, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.POST,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}`),
      body: docs,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  update(doc: Doc, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    if (!doc._id) {
      throw new KinveyError('The doc provided does not contain an _id. An _id is required to update the doc.');
    }

    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.PUT,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${doc._id}`),
      body: doc,
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  remove(query?: Query<Doc>, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const requestQueryObject = Object.assign(query ? query.toHttpQueryObject() : {});
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.DELETE,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}`, requestQueryObject),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }

  removeById(id: string, options: NetworkOptions = {}): Promise<KinveyHttpResponse> {
    const request = new KinveyHttpRequest({
      method: HttpRequestMethod.DELETE,
      auth: kinveySessionAuth,
      url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `/${this.collectionName}/${id}`),
      skipBL: options.skipBL,
      trace: options.trace,
      properties: options.properties
    });
    return request.execute();
  }
}
