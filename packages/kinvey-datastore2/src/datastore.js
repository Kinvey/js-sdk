export class DataStore {
  /**
   * Save an entity.
   */
  save(entity, options) {
    return this.create(entity, options);
  }

  create(entity, options) {
    throw new Error('Method of DataStore not implemented');
  }
}
