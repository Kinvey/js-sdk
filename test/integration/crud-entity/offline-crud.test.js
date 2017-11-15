runner.run(testFunc);

function testFunc() {
  const collectionName = externalConfig.collectionName;
  const appKey = externalConfig.appKey;
  const appSecret = externalConfig.appSecret;

  const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
  const notFoundErrorName = 'NotFoundError';
  const shouldNotBeCalledErrorMessage = 'Should not be called';

  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`${currentDataStoreType} Store CRUD Specific Tests`, () => {

      let networkStore;
      let syncStore;
      let cacheStore;
      let storeToTest;
      const dataStoreType = currentDataStoreType;
      const entity1 = {
        _id: common.randomString(),
        customProperty: common.randomString()
      };
      const entity2 = {
        _id: common.randomString(),
        customProperty: common.randomString()
      };
      const createdUserIds = [];

      before((done) => {

        Kinvey.init({
          appKey: appKey,
          appSecret: appSecret
        });

        Kinvey.User.signup()
          .then((user) => {
            createdUserIds.push(user.data._id);
            //store for setup
            networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
            syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
            //store to test
            storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
            return common.cleanUpCollectionData(collectionName)
          })
          .then(() => {
            return networkStore.save(entity1)
          })
          .then(() => {
            return networkStore.save(entity2)
          })
          .then(() => {
            return storeToTest.pull()
          })
          .then(() => {
            done();
          })
      });

      after((done) => {
        common.deleteUsers(createdUserIds)
          .then(() => {
            return Kinvey.User.logout()
          })
          .then(() => done())
          .catch(done)
      });

      if (dataStoreType === Kinvey.DataStoreType.Cache) {
        describe('local cache removal', () => {

          it('find() should remove entities that no longer exist on the backend from the cache', (done) => {
            const entity = { '_id': common.randomString() };
            return storeToTest.save(entity)
              .then((entity) => {
                return networkStore.removeById(entity._id)
              })
              .then(() => {
                return storeToTest.find().toPromise()
              })
              .then(() => {
                return syncStore.findById(entity._id).toPromise()
              })
              .then(() => {
                done(new Error(shouldNotBeCalledErrorMessage));
              })
              .catch((error) => {
                expect(error.name).to.equal(notFoundErrorName);
                return syncStore.count().toPromise()
                  .then((count) => {
                    expect(count).to.equal(2);
                    done();
                  })
              })
              .catch(done);
          });

          it.skip('findById() should remove entities that no longer exist on the backend from the cache', (done) => {
            const entity = { '_id': common.randomString() };
            return storeToTest.save(entity)
              .then((entity) => {
                return networkStore.removeById(entity._id)
              })
              .then(() => {
                return storeToTest.findById(entity._id).toPromise()
              })
              .catch((error) => {
                expect(error.name).to.equal(notFoundErrorName);
                return syncStore.findById(entity._id).toPromise()
              })
              .then(() => {
                done(new Error(shouldNotBeCalledErrorMessage));
              })
              .catch((error) => {
                expect(error.name).to.equal(notFoundErrorName);
                return syncStore.count().toPromise()
                  .then((count) => {
                    expect(count).to.be.above(0);
                    done();
                  })
              })
              .catch(done);
          });

          it('removeById should remove the entity from cache even if the entity is not found on the backend', (done) => {
            const entity = { '_id': common.randomString() };
            return storeToTest.save(entity)
              .then((entity) => {
                return networkStore.removeById(entity._id)
              })
              .then(() => {
                return storeToTest.removeById(entity._id)
              })
              .then((result) => {
                expect(result.count).to.equal(1);
                return syncStore.findById(entity._id).toPromise()
              })
              .then(() => {
                done(new Error(shouldNotBeCalledErrorMessage));
              })
              .catch((error) => {
                expect(error.name).to.equal(notFoundErrorName);
                done();
              })
              .catch(done);
          });
        });
      }

      describe('clear()', () => {
        let initialCacheCount;
        let initialBackendCount;

        beforeEach((done) => {
          return syncStore.count().toPromise()
            .then((count) => {
              initialCacheCount = count;
              return networkStore.count().toPromise()
            })
            .then((count) => {
              initialBackendCount = count;
              done();
            });
        })

        it('should remove the entities from the cache, which match the query', (done) => {
          let fieldValue = common.randomString();
          return cacheStore.save({ 'customProperty': fieldValue })
            .then(() => {
              return cacheStore.save({ 'customProperty': fieldValue })
            })
            .then(() => {
              const query = new Kinvey.Query();
              query.equalTo('customProperty', fieldValue);
              return storeToTest.clear(query)
            })
            .then((result) => {
              expect(result.count).to.equal(2);
              return syncStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(initialCacheCount);
              return networkStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(initialBackendCount + 2);
              done();
            }).catch(done);
        });

        it('should remove all entities only from the cache', (done) => {
          return syncStore.save({ '_id': common.randomString() })
            .then(() => {
              return storeToTest.clear()
            })
            .then((result) => {
              expect(result.count).to.equal(initialCacheCount + 1);
              return syncStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(0);
              return networkStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(initialBackendCount);
              done();
            }).catch(done);
        });
      });
    });
  });
}