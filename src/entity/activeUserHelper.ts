import MemoryCache = require('fast-memory-cache');
import isFunction = require('lodash/isFunction');

import { isDefined } from '../utils/object';
import { Client } from '../client';
import { Entity } from './index';

const memory = new MemoryCache();
let storage = new MemoryCache();

interface ActiveUserEntity extends Entity {
  _kmd?: {
    authtoken?: string;
    ect?: string;
    lmt?: string;
  };
}

export const ActiveUserHelper = {
  load(client = Client.sharedInstance()): Promise<ActiveUserEntity|null> {
    return new Promise((resolve) => {
      resolve(storage.get(client.appKey));
    })
      .then((value: string) => {
        try {
          value = JSON.parse(value);
        } catch (e) {
            // Catch exception
        }

        return value;
      })
      .then((activeUser) => {
        return this.set(client, activeUser);
      });
  },

  get(client = Client.sharedInstance()): ActiveUserEntity|null {
    let value = memory.get(client.appKey);

    try {
      value = JSON.parse(value);
    } catch (e) {
        // Catch exception
    }

    return value;
  },

  set(client = Client.sharedInstance(), activeUser: ActiveUserEntity): Promise<ActiveUserEntity|null> {
    if (isDefined(activeUser)) {
      // Set in memory
      memory.set(client.appKey, JSON.stringify(activeUser));

      // Set in storage
      return new Promise((resolve) => {
        resolve(storage.set(client.appKey, JSON.stringify(activeUser)));
      })
        .then(() => activeUser);
    }

    return this.remove(client);
  },

  remove(client = Client.sharedInstance()): Promise<null> {
    // Delete it from memory
    memory.delete(client.appKey);

    return new Promise((resolve) => {
      // Delete from storage
      if (isFunction(storage.remove)) {
        return resolve(storage.remove(client.appKey));
      } else if (isFunction(storage.delete)) {
        return resolve(storage.delete(client.appKey));
      }

      return resolve(null);
    })
      .then(() => null);
  },

  useStorage(StorageClass) {
    storage = new StorageClass();
  }
};