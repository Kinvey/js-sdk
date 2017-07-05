import expect = require('expect');
import nock = require('nock');
import cloneDeep = require('lodash/cloneDeep');

import { DataStore, DataStoreType } from '../src/datastore';
import { Query } from '../src/datastore/query';
import { randomString } from '../src/utils/string';
import { KinveyError } from '../src/errors';

describe('DataStore', () => {
  describe('find()', () => {
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {
      const datastore = DataStore.collection(randomString());
      datastore.find({})
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(KinveyError);
            done();
          } catch (error) {
            done(error);
          }
        }, () => {
          done(new Error('This test should throw an error.'));
        });
    });

    it('should throw an error if there are pending sync items that fail to be pushed', (done) => {
      const entity1 = { _id: randomString() };
      let datastore = DataStore.collection(randomString(), DataStoreType.Sync);
      datastore.save(entity1)
        .then(() => {
          nock(datastore.client.apiHostname)
            .put(`/appdata/${datastore.client.appKey}/${datastore.collection}/${entity1._id}`)
            .reply(400);

          datastore = DataStore.collection(datastore.collection);
          datastore.find()
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                done();
              } catch (error) {
                done(error);
              }
            }, () => {
              done(new Error('This test should throw an error.'));
            });
        })
        .catch(done);
    });

    it('should not throw an error if there are pending sync items that fail to be pushed but the type is DataStoreType.Network', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();
      let datastore = DataStore.collection(randomString(), DataStoreType.Sync);

      datastore.save(entity1)
        .then(() => {
          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .reply(200, [entity1, entity2]);

          datastore = DataStore.collection(datastore.collection, DataStoreType.Network);
          datastore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy).toHaveBeenCalledWith([entity1, entity2]);
                done();
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });

    it('should return an array of entities from the cache and the backend', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();
      const datastore = DataStore.collection(randomString());

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.find()
        .subscribe(null, done, () => {
          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .reply(200, [entity1, entity2]);

          return datastore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity2]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should return an array of entities only from the backend', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();
      const datastore = DataStore.collection(randomString(), DataStoreType.Network);

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.find()
        .subscribe(null, done, () => {
          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .reply(200, [entity1, entity2]);

          return datastore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy).toHaveBeenCalledWith([entity1, entity2]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should return an array of entities only from the cache', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();
      let datastore = DataStore.collection(randomString());

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.find()
        .subscribe(null, done, () => {
          datastore = DataStore.collection(datastore.collection, DataStoreType.Sync);
          return datastore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy).toHaveBeenCalledWith([entity1, entity2]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should return an array of entities that match the query', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const onNextSpy = expect.createSpy();
      const datastore = DataStore.collection(randomString());

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.find()
        .subscribe(null, done, () => {
          const query = new Query();
          query.equalTo('_id', entity1._id);

          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .query(query.toQueryString())
            .reply(200, [entity1]);

          return datastore.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should only fetch changed entities when using delta fetch', (done) => {
      const time = new Date();
      const entity1 = { _id: randomString(), _kmd: { lmt: new Date(time.setSeconds(time.getSeconds() - 1)).toISOString() }, title: randomString() };
      const entity2 = { _id: randomString(), _kmd: { lmt: new Date(time.setSeconds(time.getSeconds() - 1)).toISOString() }, title: randomString() };
      const onNextSpy = expect.createSpy();
      const datastore = DataStore.collection(randomString());

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.pull()
        .then(() => {
          const updatedEntity2 = cloneDeep(entity2);
          updatedEntity2.title = randomString();
          updatedEntity2._kmd.lmt = new Date().toISOString();

          const deltaQuery = new Query();
          deltaQuery.fields = ['_id', '_kmd.lmt'];

          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .query(deltaQuery.toQueryString())
            .reply(200, [entity1, updatedEntity2]);

          const deltaSetQuery = new Query();
          deltaSetQuery.contains('_id', [entity2._id]);

          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .query(deltaSetQuery.toQueryString())
            .reply(200, [updatedEntity2]);

          return datastore.find(null, { useDeltaFetch: true })
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, updatedEntity2]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });

    it('should update the cache to match the backend', (done) => {
      let entity1 = { _id: randomString(), title: undefined };
      const entity2 = { _id: randomString() };
      const entity3 = { _id: randomString() };
      let datastore = DataStore.collection(randomString());
      const onNextSpy = expect.createSpy();

      nock(datastore.client.apiHostname)
        .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
        .reply(200, [entity1, entity2]);

      datastore.pull()
        .then(() => {
          entity1 = { _id: entity1._id, title: randomString() };
          nock(datastore.client.apiHostname)
            .get(`/appdata/${datastore.client.appKey}/${datastore.collection}`)
            .reply(200, [entity1, entity3]);
          return datastore.find().toPromise();
        })
        .then(() => {
          datastore = DataStore.collection(datastore.collection, DataStoreType.Sync);
          datastore.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy).toHaveBeenCalledWith([entity1, entity3]);
                done();
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });
  });

  describe('collection()', () => {
    it('should throw an error if a collection is not provided', function() {
      expect(function() {
        const datastore = DataStore.collection(null);
        return datastore;
      }).toThrow();
    });

    it('should throw an error if the collection is not a string', function() {
      expect(function() {
        const datastore = DataStore.collection({});
        return datastore;
      }).toThrow();
    });

    it('should return a DataStore instance', function() {
      expect(DataStore.collection(randomString())).toBeA(DataStore);
    });

    it('should return a Cache DataStore by default', function() {
      const datastore = DataStore.collection(randomString());
      expect(datastore.type).toEqual(DataStoreType.Cache);
    });

    it('should return a Network DataStore', function() {
      const datastore = DataStore.collection(randomString(), DataStoreType.Network);
      expect(datastore.type).toEqual(DataStoreType.Network);
    });

    it('should return a Cache DataStore', function() {
      const datastore = DataStore.collection(randomString(), DataStoreType.Cache);
      expect(datastore.type).toEqual(DataStoreType.Cache);
    });

    it('should return a Sync DataStore', function() {
      const datastore = DataStore.collection(randomString(), DataStoreType.Sync);
      expect(datastore.type).toEqual(DataStoreType.Sync);
    });
  });
});