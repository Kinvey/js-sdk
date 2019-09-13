import isString from 'lodash/isString';

export class DataStore {
  public collectionName: string;

  constructor(collectionName: string) {
    if (!isString(collectionName)) {
      throw new Error('A collectionName is required and must be a string.');
    }

    this.collectionName = collectionName;
  }
}
