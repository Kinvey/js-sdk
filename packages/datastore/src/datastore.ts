import { Aggregation } from '@progresskinvey/js-sdk-aggregation';
import { Query } from '@progresskinvey/js-sdk-query';
import { Entity } from '@progresskinvey/js-sdk-storage';
import { SyncPushResult } from './sync';
import { MultiSaveResult } from './network';

export interface DataStore<T extends Entity> {
  find(query?: Query): Promise<T[]>;
  count(query?: Query): Promise<number>;
  group<K>(aggregation: Aggregation<K>): Promise<K>;
  findById(id: string): Promise<T>;
  create(entities: T | T[]): Promise<T | MultiSaveResult<T>>;
  update(entity: T | T[]): Promise<T | MultiSaveResult<T>>;
  save(entities: T | T[]): Promise<T | MultiSaveResult<T>>;
  remove(query?: Query): Promise<number>;
  removeById(id: string): Promise<number>;
  push(): Promise<SyncPushResult<T>[]>;
  pull(query?: Query): Promise<number>;
}

// export class DataStore<T extends Entity> {
//   public collectionName: string;

//   constructor(collectionName: string) {
//     if (!isString(collectionName)) {
//       throw new Error('A collectionName is required and must be a string.');
//     }

//     this.collectionName = collectionName;
//   }

//   async find(): Promise<T[]> {
//     throw new Error('This method is not implemented.');
//   }

//   async count(): Promise<number> {
//     throw new Error('This method is not implemented.');
//   }

//   async group<K>(aggregation: Aggregation<K>, options?: NetworkOptions): Promise<K> {
//     throw new Error('This method is not implemented.');
//   }

//   async findById(): Promise<T> {
//     throw new Error('This method is not implemented.');
//   }

//   create(): Promise<T>;
//   create(): Promise<MultiInsertResult<T>>;
//   async create(): Promise<any> {
//     throw new Error('This method is not implemented.');
//   }

//   async update(): Promise<T> {
//     throw new Error('This method is not implemented.');
//   }

//   save(): Promise<T>;
//   save(): Promise<MultiInsertResult<T>>;
//   save(): Promise<any> {
//     throw new Error('This method is not implemented.');
//   }

//   async remove(): Promise<number> {
//     throw new Error('This method is not implemented.');
//   }

//   async removeById(): Promise<number> {
//     throw new Error('This method is not implemented.');
//   }
// }
