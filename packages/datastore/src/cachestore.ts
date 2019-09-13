import { Entity } from '@progresskinvey/js-sdk-storage';
import { Query } from '@progresskinvey/js-sdk-query';
import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { DataStore } from './datastore';
import { DataStoreCache } from './cache';

export interface CacheStoreOptions {
  tag?: string;
  useDeltaSet?: boolean;
  useAutoPagination?: boolean;
}

export class CacheStore<T> extends DataStore {
  public cache?: DataStoreCache<T>;
  public useDeltaSet: boolean;
  public useAutoPagination: boolean;

  constructor(collectionName: string, options: CacheStoreOptions = {}) {
    super(collectionName);
    this.cache = new DataStoreCache(collectionName, options.tag);
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true;
  }

  find(query?: Query): Promise<T[]> {
    return this.cache.find(query);
  }

  count(query?: Query): Promise<number> {
    return this.cache.count(query);
  }

  group<K>(aggregation: Aggregation<K>): Promise<K> {
    return this.cache.group<K>(aggregation);
  }

  findById(id: string): Promise<Entity> {
    return this.cache.findById(id);
  }

  create(entity: Entity): Promise<Entity>;
  create(entities: Entity[]): Promise<Entity[]>;
  create(entities: any): Promise<any> {
    return this.cache.save(entities);
  }

  update(entity: Entity): Promise<Entity>;
  update(entities: Entity[]): Promise<Entity[]>;
  update(entities: any): Promise<any> {
    return this.cache.save(entities);
  }

  save(entity: Entity): Promise<Entity>;
  save(entities: Entity[]): Promise<Entity[]>;
  save(entities: any): Promise<any> {
    return this.cache.save(entities);
  }

  remove(query?: Query): Promise<number> {
    return this.cache.remove(query);
  }

  removeById(id: string): Promise<number> {
    return this.cache.removeById(id);
  }
}
