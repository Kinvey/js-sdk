runner.run(testFunc);

function testFunc() {
  const collectionName = externalConfig.collectionName;
  const appKey = externalConfig.appKey;
  const appSecret = externalConfig.appSecret;

  const dataStoreTypes = [Kinvey.DataStoreType.Cache];
  const notFoundErrorName = 'NotFoundError';
  const shouldNotBeCalledErrorMessage = 'Should not be called';


  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`Store Specific Tests`, () => {

      let networkStore;
      let syncStore;
      let storeToTest;
      const dataStoreType = currentDataStoreType;
      const entity1 = {
        _id: randomString(),
        customProperty: randomString()
      };
      const entity2 = {
        _id: randomString(),
        customProperty: randomString()
      };


      before((done) => {

        Kinvey.initialize({
          appKey: appKey,
          appSecret: appSecret
        });

        Kinvey.User.signup()
          .then(() => {
            //store for setup
            networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
            syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            //store to test
            storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
            return cleanCollectionData(collectionName, Kinvey.DataStoreType.Network)
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
        return Kinvey.User.logout()
          .then(() => {
            done();
          })
      });

      if (dataStoreType === Kinvey.DataStoreType.Cache) {
        describe.skip(`${currentDataStoreType}`, function () {

          it('find() should remove entities that no longer exist on the backend from the cache', (done) => {
            const entity = { '_id': randomString() };
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
            const entity = { '_id': randomString() };
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
            const entity = { '_id': randomString() };
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
    });
  });
}