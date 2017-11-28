import isString from 'lodash/isString';
import { Operation, OperationType } from '../operations';

export class DataStore {
  constructor(collection) {
    if (collection && !isString(collection)) {
      throw new Error('Collection must be a string.');
    }

    this.collection = collection;
  }

  /**
   * Save an entity.
   */
  save(entity, options) {
    return this.create(entity, options);
  }

  create(entity, options) {
    const operation = this._buildOperationObject(OperationType.Create, null, entity);
  }

  _buildOperationObject(type, query, data, id) {
    return new Operation(type, this.collection, query, data, id);
  }
}
