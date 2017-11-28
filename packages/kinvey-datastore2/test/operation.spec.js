import { expect } from 'chai';
import { Operation, OperationType } from '../src';

describe('OperationType', () => {
  it('should have type Create', () => {
    expect(OperationType.Create).to.not.be.undefined;
  });
});

describe('Operation', () => {
  describe('constructor', () => {
    it('should create an operation', () => {
      const operation = new Operation();
      expect(operation).to.be.an.instanceof(Operation);
    });

    it('should set the type', () => {
      const type = 'test';
      const operation = new Operation({ type: type });
      expect(operation.type).to.equal(type);
    });

    it('should set the collection', () => {
      const collection = 'test';
      const operation = new Operation({ collection: collection });
      expect(operation.collection).to.equal(collection);
    });

    it('should set the query', () => {
      const query = 'test';
      const operation = new Operation({ query: query });
      expect(operation.query).to.equal(query);
    });

    it('should set the data', () => {
      const data = 'test';
      const operation = new Operation({ data: data });
      expect(operation.data).to.equal(data);
    });

    it('should set the entityId', () => {
      const entityId = 'test';
      const operation = new Operation({ entityId: entityId });
      expect(operation.entityId).to.equal(entityId);
    });
  });
});
