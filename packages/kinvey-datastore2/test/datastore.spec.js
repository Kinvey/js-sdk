import { expect } from 'chai';
import { spy } from 'sinon';
import { DataStore, DataStoreType, collection } from '../src';

describe('DataStoreType', () => {
  it('should have type Cache', () => {
    expect(DataStoreType.Cache).to.not.be.undefined;
  });

  it('should have type Network', () => {
    expect(DataStoreType.Network).to.not.be.undefined;
  });

  it('should have type Sync', () => {
    expect(DataStoreType.Sync).to.not.be.undefined;
  });
});

describe('DataStore', () => {
  describe('constructor', () => {
    it('should throw and error if a collection is not defined', () => {
      expect(() => new DataStore()).to.throw();
    });

    it('should set the collection', () => {
      const collectionName = 'test';
      const datastore = new DataStore(collectionName);
      expect(datastore.collection).to.equal(collectionName);
    });
  });

  describe('save()', () => {
    let datastore;

    before(() => {
      datastore = new DataStore('test');
    });

    it('should call create()', () => {
      const createSpy = spy(datastore, 'create');
      const entity = {};
      const options = {};
      datastore.save(entity, options);
      expect(createSpy.called).to.be.true;
      expect(createSpy.calledWith(entity, options)).to.be.true;
    });
  });

  describe('create()', () => {
    let datastore;

    before(() => {
      datastore = new DataStore('test');
    });

    it('should create an entity');
  });
});

describe('collection()', () => {
  it('should throw and error if a collection is not defined', () => {
    expect(() => collection()).to.throw();
  });

  it('should return a DataStore instance', () => {
    const datastore = collection('');
    expect(datastore).to.be.an.instanceof(DataStore);
  });

  it('should set the collection', () => {
    const collectionName = 'test';
    const datastore = collection(collectionName);
    expect(datastore.collection).to.equal(collectionName);
  });

  it('should return a DataStore instance for DataStoreType.Cache');
  it('should return a DataStore instance for DataStoreType.Network');
  it('should return a DataStore instance for DataStoreType.Sync');
});
