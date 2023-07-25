import { isArray, cloneDeep } from 'lodash-es';
import { Observable } from 'rxjs';
import { getDeviceId } from '../device';
import { Aggregation } from '../aggregation';
import { Query } from '../query';
import { KinveyError } from '../errors/kinvey';
import { getSession, formatKinveyBaasUrl, HttpRequestMethod, KinveyHttpRequest, KinveyBaasNamespace, KinveyHttpAuth } from '../http';
import { getAppKey, getApiVersion } from '../kinvey';
import { subscribeToChannel, unsubscribeFromChannel, LiveServiceReceiver } from '../live';
import { Kmd } from '../kmd';

export function createRequest(method: HttpRequestMethod, url: string, body?: any) {
  return new KinveyHttpRequest({
    method,
    auth: KinveyHttpAuth.SessionOrMaster,
    url,
    body
  });
}

export class NetworkStore {
  public collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  get collection() {
    return this.collectionName;
  }

  get pathname() {
    return `/${this.collectionName}`;
  }

  get channelName() {
    return `${getAppKey()}.c-${this.collectionName}`;
  }

  async getPersonalChannelName() {
    const session = await getSession();
    if (session) {
      return `${this.channelName}.u-${session._id}`;
    }
    return undefined;
  }

  find(query?: Query, options: any = {}) {
    const stream = Observable.create(async (observer: any) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL,
          kinveyFileTTL,
          kinveyFileTLS,
        } = options;
        const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS });
        const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, this.pathname, queryObject);
        const request = createRequest(HttpRequestMethod.GET, url);
        request.headers.setCustomRequestProperties(properties);
        request.timeout = timeout;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  count(query?: Query, options: any = {}) {
    const stream = Observable.create(async (observer: any) => {
      try {
        if (query && !(query instanceof Query)) {
          throw new KinveyError('Invalid query. It must be an instance of the Query class.');
        }

        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL
        } = options;
        const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
        const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_count`, queryObject);
        const request = createRequest(HttpRequestMethod.GET, url);
        request.headers.setCustomRequestProperties(properties);
        request.timeout = timeout;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data.count);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  group(aggregation: Aggregation, options: any = {}) {
    const stream = Observable.create(async (observer: any) => {
      try {
        if (!(aggregation instanceof Aggregation)) {
          throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
        }

        const {
          rawResponse = false,
          timeout,
          properties,
          trace,
          skipBL
        } = options;
        const queryObject = {};
        const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_group`, queryObject);
        const request = createRequest(HttpRequestMethod.POST, url, aggregation.toPlainObject());
        request.headers.setCustomRequestProperties(properties);
        request.timeout = timeout;
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  findById(id: string, options: any = {}) {
    const stream = Observable.create(async (observer: any) => {
      try {
        // if (!id) {
        //   throw new Error('No id was provided. A valid id is required.');
        // }

        if (id) {
          const {
            rawResponse = false,
            timeout,
            properties,
            trace,
            skipBL,
            kinveyFileTTL,
            kinveyFileTLS,
          } = options;
          const queryObject = { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS };
          const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/${id}`, queryObject);
          const request = createRequest(HttpRequestMethod.GET, url);
          request.headers.setCustomRequestProperties(properties);
          request.timeout = timeout;
          const response = await request.execute();

          if (rawResponse === true) {
            observer.next(response);
          } else {
            observer.next(response.data);
          }
        } else {
          observer.next(undefined);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  async create(docs: any, options: any = {}) {
    const batchSize = 100;
    const apiVersion = getApiVersion();

    if (isArray(docs)) {
      if (apiVersion < 5) {
        throw new KinveyError('Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.');
      }

      if (docs.length === 0) {
        throw new KinveyError('Unable to create an array of entities. The array must not be empty.');
      }
    }

    if (isArray(docs) && docs.length > batchSize) {
      let i = 0;

      const batchCreate = async (previousResult: any = { entities: [], errors: [] }): Promise<any> => {
        if (i >= docs.length) {
          return previousResult;
        }

        const batch = docs.slice(i, i + batchSize);
        const result = await this.create(batch, options);
        result.errors.forEach((e) => (e.index += i));
        const combinedResult = {
          entities: previousResult.entities.concat(result.entities),
          errors: previousResult.errors.concat(result.errors)
        };

        i += batchSize;
        return batchCreate(combinedResult);
      };

      return batchCreate();
    }

    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, this.pathname, queryObject);
    const request = createRequest(HttpRequestMethod.POST, url, docs);
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc: any, options: any = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities. Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.');
    }

    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/${doc._id}`, queryObject);
    const request = createRequest(HttpRequestMethod.PUT, url, doc);
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async save(doc: any, options?: any) {
    const apiVersion = getApiVersion();
    if (apiVersion >= 5 && isArray(doc)) {
      throw new KinveyError('Unable to save an array of entities. Use "create" method to insert multiple entities.');
    }

    if (doc._id) {
      const kmd = new Kmd(cloneDeep(doc));
      if (!kmd.isLocal()) {
        return this.update(doc, options);
      }
    }

    return this.create(doc, options);
  }

  async remove(query: Query, options: any = {}) {
    if (!query) {
      throw new KinveyError('A query must be provided to remove entities.');
    }

    if (!(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = Object.assign({}, query ? query.toQueryObject() : {});
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, this.pathname, queryObject);
    const request = createRequest(HttpRequestMethod.DELETE, url);
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id: string, options: any = {}) {
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = {};
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/${id}`, queryObject);
    const request = createRequest(HttpRequestMethod.DELETE, url);
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async subscribe(receiver: LiveServiceReceiver, options: any = {}) {
    const {
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const deviceId = await getDeviceId();
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_subscribe`);
    const request = createRequest(HttpRequestMethod.POST, url, { deviceId });
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    await request.execute();
    subscribeToChannel(this.channelName, receiver);
    const personalChannelName = await this.getPersonalChannelName();
    if (personalChannelName) {
      subscribeToChannel(personalChannelName, receiver);
    }
    return true;
  }

  async unsubscribe(options: any = {}) {
    const {
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const deviceId = await getDeviceId();
    const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_unsubscribe`);
    const request = createRequest(HttpRequestMethod.POST, url, { deviceId });
    request.headers.setCustomRequestProperties(properties);
    request.timeout = timeout;
    await request.execute();
    unsubscribeFromChannel(this.channelName);
    unsubscribeFromChannel(await this.getPersonalChannelName());
    return true;
  }
}
