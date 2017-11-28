export const OperationType = {
  Create: 'Create'
};
Object.freeze(OperationType);

export class Operation {
  constructor(config = {}) {
    this.type = config.type;
    this.collection = config.collection;
    this.query = config.query;
    this.data = config.data;
    this.entityId = config.entityId;
  }
}
