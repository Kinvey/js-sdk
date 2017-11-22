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
      const entity1 = common.getSingleEntity(common.randomString());
      const createdUserIds = [];

      before((done) => {
        Kinvey.init({
          appKey: appKey,
          appSecret: appSecret
        });
        Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            //store for setup
            networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
            syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            cacheStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
            //store to test
            storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
            done();
          })
          .catch(done)
      });

      beforeEach((done) => {
        common.cleanUpCollectionData(collectionName)
          .then(() => {
            return cacheStore.save(entity1)
          })
          .then(() => done())
          .catch(done)
      });

      after((done) => {
        Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup()
          })
          .then((user) => {
            createdUserIds.push(user.data._id);
            return common.cleanUpCollectionData(collectionName)
          })
          .then(() => {
            return common.deleteUsers(createdUserIds)
          })
          .then(() => {
            return Kinvey.User.logout()
          })
          .then(() => done())
          .catch(done)
      });

      if (dataStoreType === Kinvey.DataStoreType.Cache) {
        describe('local cache removal', () => {

          it('find() should remove entities that no longer exist in the backend from the cache', (done) => {
            const entity = common.getSingleEntity(common.randomString());
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
                return done(new Error(shouldNotBeCalledErrorMessage));
              })
              .catch((error) => {
                expect(error.name).to.equal(notFoundErrorName);
                return syncStore.count().toPromise()
                  .then((count) => {
                    expect(count).to.equal(1);
                    done();
                  })
              })
              .catch(done);
          });

          it.skip('findById() should remove entities that no longer exist on the backend from the cache', (done) => {
            const entity = common.getSingleEntity(common.randomString());
            storeToTest.save(entity)
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
                    expect(count).to.equal(1);
                    done();
                  })
              })
              .catch(done);
          });

          it('removeById should remove the entity from cache even if the entity is not found on the backend', (done) => {
            const entity = common.getSingleEntity(common.randomString());
            storeToTest.save(entity)
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
                return done(new Error(shouldNotBeCalledErrorMessage));
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

        it('should remove the entities from the cache, which match the query', (done) => {
          const randomId = common.randomString();
          cacheStore.save({ '_id': randomId })
            .then(() => {
              const query = new Kinvey.Query();
              query.equalTo('_id', randomId);
              return storeToTest.clear(query)
            })
            .then((result) => {
              expect(result.count).to.equal(1);
              return syncStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(1);
              return networkStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(2);
              done();
            }).catch(done);
        });

        it('should remove all entities only from the cache', (done) => {
          cacheStore.save({})
            .then(() => {
              return storeToTest.clear()
            })
            .then((result) => {
              expect(result.count).to.equal(2);
              return syncStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(0);
              return networkStore.count().toPromise()
            })
            .then((count) => {
              expect(count).to.equal(2);
              done();
            }).catch(done);
        });
      });
    });
  });
}