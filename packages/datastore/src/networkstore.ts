import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import partition from 'lodash/partition';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { DataStoreNetwork, FindNetworkOptions, NetworkOptions, MultiSaveResult, MultiSaveResponse } from './network';
import { DataStore } from './datastore';
import { SyncPushResult } from './sync';

export class NetworkStore<T extends Entity> implements DataStore<T> {
  private collectionName: string;
  private network: DataStoreNetwork<T>;

  constructor(collectionName: string) {
    if (!isString(collectionName)) {
      throw new Error('A collectionName is required and must be a string.');
    }

    this.collectionName = collectionName;
    this.network = new DataStoreNetwork<T>(collectionName);
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
    const response = await this.network.find(query, options);
    return response.data;
  }

  async count(query?: Query, options?: NetworkOptions): Promise<number> {
    const response = await this.network.count(query, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  async group<K>(aggregation: Aggregation<K>, options?: NetworkOptions): Promise<K> {
    const response = await this.network.group(aggregation, options);
    return response.data;
  }

  async findById(id: string, options?: NetworkOptions): Promise<T> {
    const response = await this.network.findById(id, options);
    return response.data;
  }

  async create(entities: T | T[], options?: NetworkOptions): Promise<T | MultiSaveResult<T>> {
    const response = await this.network.create(entities, options);
    return response.data;
  }

  async update(entities: T | T[], options?: NetworkOptions): Promise<T | MultiSaveResult<T>> {
    const response = await this.network.update(entities, options);
    return response.data;
  }

  async save(entities: T | T[], options?: NetworkOptions): Promise<T | MultiSaveResult<T>> {
    if (isArray(entities)) {
      const newItems = [];
      const [entitiesToCreate, entitiesToUpdate] = partition(entities, (entity) => {
        if (entity._id) {
          newItems.push(false);
          return false;
        }
        newItems.push(true);
        return true;
      });
      const createResult = await this.create(entitiesToCreate, options);
      const updateResult = await this.update(entitiesToUpdate, options);

      newItems.reduce(
        ({ entities, errors }, isNew, index) => {
          if (isNew) {
            const entity = (createResult as MultiSaveResult<T>).entities.shift();
            if (!entity) {
            }
          } else {
            const entity = (updateResult as MultiSaveResult<T>).entities.shift();
          }
        },
        { entities: [], errors: [] }
      );
    }

    if ((entities as T)._id) {
      return this.update(entities, options);
    }
    return this.create(entities, options);
  }

  async remove(query?: Query, options?: NetworkOptions): Promise<number> {
    const response = await this.network.remove(query, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  async removeById(id: string, options?: NetworkOptions): Promise<number> {
    const response = await this.network.removeById(id, options);
    return 'count' in response.data ? response.data.count : 0;
  }

  async push(): Promise<SyncPushResult<T>[]> {
    throw new Error('push() is not supported on a NetworkStore.');
  }

  async pull(): Promise<number> {
    throw new Error('pull() is not supported on a NetworkStore.');
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
