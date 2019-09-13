import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import { getApiVersion } from '@progresskinvey/js-sdk-init';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { Kmd } from '@progresskinvey/js-sdk-kmd';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { DataStoreNetwork, FindNetworkOptions, NetworkOptions } from './network';

export interface MultiInsertResult<T extends Entity> {
  entities: T[];
  errors: Error[];
}

export class NetworkStore<T extends Entity> {
  public collectionName: string;

  constructor(collectionName: string) {
    if (!isString(collectionName)) {
      throw new Error('A collectionName is required and must be a string.');
    }

    this.collectionName = collectionName;
  }

  get collection(): string {
    return this.collectionName;
  }

  get pathname(): string {
    return `/${this.collectionName}`;
  }

  // get channelName(): string {
  //   return `${getAppKey()}.c-${this.collectionName}`;
  // }

  // get personalChannelName() {
  //   const session = getSession();
  //   if (session) {
  //     return `${this.channelName}.u-${session._id}`;
  //   }
  //   return undefined;
  // }

  async find(query?: Query, options?: FindNetworkOptions): Promise<T[]> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.find(query, options);
    return response.data;
  }

  async count(query?: Query, options?: NetworkOptions): Promise<number> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.count(query, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  async group<K>(aggregation: Aggregation<K>, options?: NetworkOptions): Promise<K> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.group<K>(aggregation, options);
    return response.data;
  }

  async findById(id: string, options?: NetworkOptions): Promise<T> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.findById(id, options);
    return response.data;
  }

  create(doc: T, options?: NetworkOptions): Promise<T>;
  create(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>;
  async create(docs: any, options?: NetworkOptions): Promise<any> {
    const batchSize = 100;
    const apiVersion = getApiVersion();

    if (apiVersion !== 5 && isArray(docs)) {
      throw new Error('Unable to create an array of docs. Please create docs one by one.');
    }

    if (isArray(docs) && docs.length > batchSize) {
      let i = 0;

      const batchCreate = async (
        result: MultiInsertResult<T> = { entities: [], errors: [] }
      ): Promise<MultiInsertResult<T>> => {
        if (i >= docs.length) {
          return result;
        }

        const batch = docs.slice(i, i + batchSize);
        i += batch.length;
        const batchResult = await this.create(batch as T[], options);
        return batchCreate({
          entities: result.entities.concat(batchResult.entities),
          errors: result.errors.concat(batchResult.errors),
        });
      };

      return batchCreate();
    }

    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.create(docs, options);
    return response.data;
  }

  async update(doc: T, options?: NetworkOptions): Promise<T> {
    if (isArray(doc)) {
      throw new Error('Unable to update an array of docs. Please update docs one by one.');
    }

    if (!doc._id) {
      throw new Error('The doc does not contain an _id. An _id is required to update the doc.');
    }

    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.update(doc, options);
    return response.data;
  }

  save(doc: T, options?: NetworkOptions): Promise<T>;
  save(docs: T[], options?: NetworkOptions): Promise<MultiInsertResult<T>>;
  save(docs: any, options?: NetworkOptions): Promise<any> {
    if (!isArray(docs)) {
      const kmd = new Kmd(docs._kmd);

      if (docs._id && !kmd.isLocal()) {
        return this.update(docs, options);
      }
    }

    return this.create(docs, options);
  }

  async remove(query?: Query, options?: NetworkOptions): Promise<number> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.remove(query, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  async removeById(id: string, options?: NetworkOptions): Promise<number> {
    const network = new DataStoreNetwork(this.collectionName);
    const response = await network.removeById(id, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  // async subscribe(receiver: LiveServiceReceiver, options: any = {}) {
  //   const { timeout, properties, trace, skipBL } = options;
  //   const deviceId = await getDeviceId();
  //   const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_subscribe`);
  //   const request = createRequest(HttpRequestMethod.POST, url, { deviceId });
  //   request.headers.setCustomRequestProperties(properties);
  //   request.timeout = timeout;
  //   await request.execute();
  //   subscribeToChannel(this.channelName, receiver);
  //   if (this.personalChannelName) {
  //     subscribeToChannel(this.personalChannelName, receiver);
  //   }
  //   return true;
  // }

  // async unsubscribe(options: any = {}) {
  //   const { timeout, properties, trace, skipBL } = options;
  //   const deviceId = await getDeviceId();
  //   const url = formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${this.pathname}/_unsubscribe`);
  //   const request = createRequest(HttpRequestMethod.POST, url, { deviceId });
  //   request.headers.setCustomRequestProperties(properties);
  //   request.timeout = timeout;
  //   await request.execute();
  //   unsubscribeFromChannel(this.channelName);
  //   unsubscribeFromChannel(this.personalChannelName);
  //   return true;
  // }
}
