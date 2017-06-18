import { Promise } from 'es6-promise';
import MemoryCache = require('fast-memory-cache');
import keyBy = require('lodash/keyBy');
import forEach = require('lodash/forEach');
import values = require('lodash/values');
import find = require('lodash/find');
import isString = require('lodash/isString');
import isArray = require('lodash/isArray');

import { Adapter } from './adapter';
import { isDefined } from '../../utils/object';
import { NotFoundError } from '../../errors';

const caches = {};

interface IEntity {
  _id: string;
}

interface IMemoryCache {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): any;
  delete(key: string): void;
  clear(): void;
}

class Memory implements Adapter {
  name: string;
  cache: IMemoryCache;

  constructor(name: string) {
    if (isDefined(name) === false) {
      throw new Error('A name for the collection is required to use the memory persistence adapter.');
    }

    if (isString(name) === false) {
      throw new Error('The name of the collection must be a string to use the memory persistence adapter');
    }

    this.name = name;
    this.cache = caches[name];

    if (isDefined(this.cache) === false) {
      this.cache = new MemoryCache();
      caches[name] = this.cache;
    }
  }

  find(collection: string): Promise<IEntity[]> {
    return Promise.resolve(this.cache.get(collection))
  }

  findById(collection: string, id: string): Promise<IEntity> {
    return this.find(collection)
      .then((entities) => {
        return find(entities, entity => entity._id === id);
      });
  }

  save(collection: string, entities = []): Promise<IEntity[]> {
    if (entities.length === 0) {
      return Promise.resolve(entities);
    }

    return this.find(collection)
      .then((existingEntities) => {
        const keyedExistingEntities = keyBy(existingEntities, '_id');
        const keyedEntities = keyBy(entities, '_id');
        const entityIds = Object.keys(keyedEntities);

        forEach(entityIds, (id) => {
          keyedExistingEntities[id] = keyedEntities[id];
        });

        this.cache.set(collection, values(keyedExistingEntities));
        return entities;
      });
  }

  removeById(collection: string, id: string): Promise<{ count: number }> {
    return this.find(collection)
      .then((entities) => {
        const keyedEntities = keyBy(entities, '_id');
        const entity = keyedEntities[id];

        if (isDefined(entity) === false) {
          return { count: 0 };
        }

        delete keyedEntities[id];
        this.cache.set(collection, values(keyedEntities));
        return { count: 1 };
      });
  }

  clear(): Promise<{ count: number }> {
    this.cache.clear();
    return Promise.resolve({ count: 0 });
  }
}

export const MemoryAdapter = {
  load(name) {
    return new Memory(name);
  }
};
