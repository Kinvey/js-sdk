import { Promise } from 'es6-promise';
import isString = require('lodash/isString');
import isArray = require('lodash/isArray');

import { isDefined } from '../../utils/object';
import { Queue } from '../../utils/promise';
import { NotFoundError } from '../../errors';
import { MemoryAdapter } from './memory';
import { Adapter } from './adapter';

const queue = new Queue(1, Infinity);

export class Storage {
  name: string;

  constructor(name) {
    if (isDefined(name) === false) {
      throw new Error('Unable to create a Storage instance without a name.');
    }

    if (isString(name) === false) {
      throw new Error('The name is not a string. A name must be a string to create a Storage instance.');
    }

    this.name = name;
  }

  loadAdapter(): Promise<Adapter> {
    return Promise.resolve()
      .then(() => MemoryAdapter.load(this.name))
      .then((adapter) => {
        if (isDefined(adapter) === false) {
          throw new Error('Unable to load a storage adapter.');
        }

        return adapter;
      });
  }

  generateObjectId(length = 24): string {
    const chars = 'abcdef0123456789';
    let objectId = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      objectId += chars.substring(pos, pos + 1);
    }

    return objectId;
  }

  find(collection: string): Promise<{}[]> {
    if (isString(collection) === false) {
      return Promise.reject(new Error('collection argument must be a string'));
    }

    return this.loadAdapter()
      .then(adapter => adapter.find(collection))
      .catch((error) => {
        if (error instanceof NotFoundError || error.code === 404) {
          return [];
        }

        throw error;
      })
      .then((entities = []) => entities);
  }

  findById(collection: string, id: string): Promise<{}> {
    if (isString(collection) === false) {
      return Promise.reject(new Error('collection argument must be a string'));
    }

    if (isString(id) === false) {
      return Promise.reject(new Error('id argument must be a string'));
    }

    return this.loadAdapter()
      .then(adapter => adapter.findById(collection, id));
  }

  save(collection: string, entities = []): Promise<{}[]> {
    if (isString(collection) === false) {
      return Promise.reject(new Error('collection argument must be a string'));
    }

    if (isDefined(entities) === false) {
      return Promise.resolve(null);
    }

    return queue.add(() => {
      let singular = false;

      if (isArray(entities) === false) {
        singular = true;
        entities = [entities];
      }

      entities = entities.map((entity) => {
        if (isDefined(entity._id) === false) {
          const kmd = entity._kmd || {};
          kmd.local = true;
          entity._kmd = kmd;
          entity._id = this.generateObjectId();
        }

        return entity;
      });

      return this.loadAdapter()
        .then(adapter => adapter.save(collection, entities))
        .then((entities) => {
          if (singular && entities.length > 0) {
            return entities[0];
          }

          return entities;
        });
    });
  }

  remove(collection: string, entities = []): Promise<{ count: number }> {
    let singular = false;

    if (isString(collection) === false) {
      return Promise.reject(new Error('collection argument must be a string'));
    }

    if (isDefined(entities) === false) {
      return Promise.resolve({ count: 0 });
    }

    if (isArray(entities) === false) {
      singular = true;
      entities = [entities];
    }

    return Promise.all(entities.map((entity) => {
      if (isDefined(entity._id) === false) {
        return Promise.reject('Unable to remove an entity because it does not have _id.');
      }

      return this.removeById(collection, entity._id);
    }))
      .then((results: { count: number }[]) => {
        return results.reduce((response, result) => {
          response.count += result.count;
          return response;
        }, { count: 0 });
      });
  }

  removeById(collection: string, id: string): Promise<{ count: number}> {
    if (isString(collection) === false) {
      return Promise.reject(new Error('collection argument must be a string'));
    }

    if (isString(id) === false) {
      return Promise.reject(new Error('id argument must be a string'));
    }

    return queue.add(() => {
      return this.loadAdapter()
        .then(adapter => adapter.removeById(collection, id));
    });
  }

  clear(): Promise<{ count: number }> {
    return queue.add(() => {
      return this.loadAdapter()
        .then(adapter => adapter.clear());
    });
  }
}
