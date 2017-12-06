import { expect, use } from 'chai';
import { MemoryKeyValuePersister } from './memory-key-value-persister';

use(require('chai-as-promised'));

describe('MemoryKeyValuePersister', () => {
  describe('readEntities()', () => {
    it('should throw an error if a key is undefined', () => {
      const persister = new MemoryKeyValuePersister();
      const promise = persister.readEntities(undefined);
      return expect(promise).to.be.rejected;
    });

    it('should throw an error if a key is null', () => {
      const persister = new MemoryKeyValuePersister();
      const promise = persister.readEntities(null);
      return expect(promise).to.be.rejected;
    });

    it('should return the data for a key', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });
  });

  describe('persistEntities', () => {
    it('should throw an error if a key is undefined', () => {
      const persister = new MemoryKeyValuePersister();
      const data = [{ _id: 'test' }];
      const promise = persister.persistEntities(undefined, data);
      return expect(promise).to.be.rejected;
    });

    it('should throw an error if a key is null', () => {
      const persister = new MemoryKeyValuePersister();
      const data = [{ _id: 'test' }];
      const promise = persister.persistEntities(null, data);
      return expect(promise).to.be.rejected;
    });

    it('should throw and error if data is undefined', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.persistEntities(key, undefined))
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });

    it('should throw and error if data is null', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.persistEntities(key, null))
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });

    it('should store the data', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });
  });

  describe('deleteEntities()', () => {
    it('should do nothing if a key is undefined', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.deleteEntities(undefined))
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });

    it('should do nothing if a key is null', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const data = [{ _id: 'test' }];
      return persister.persistEntities(key, data)
        .then(() => persister.deleteEntities(null))
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.deep.equal(data));
    });

    it('should remove the stored data for a key', () => {
      const persister = new MemoryKeyValuePersister();
      const key = 'test';
      const entities = [{ _id: 'test' }];
      return persister.persistEntities(key, entities)
        .then(() => persister.deleteEntities(key))
        .then(() => persister.readEntities(key))
        .then((storedData) => expect(storedData).to.be.undefined);
    });
  });
});
