runner.run(testFunc);

function testFunc() {
  const collectionName = externalConfig.collectionName;
  const appKey = externalConfig.appKey;
  const appSecret = externalConfig.appSecret;

  const dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Sync, Kinvey.DataStoreType.Cache];
  const invalidQueryMessage = 'Invalid query. It must be an instance of the Query class.';
  const notFoundErrorName = 'NotFoundError';


  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`CRUD Entity - ${currentDataStoreType}`, () => {
      
      let networkStore;
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

      const entity3 = {
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
            if (dataStoreType !== Kinvey.DataStoreType.Network) {
              return storeToTest.pull()
            }
          })
          .then(() => {
            return networkStore.save(entity3)
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

      describe('count()', function () {
        it('should throw an error for an invalid query', (done) => {
          storeToTest.count({})
            .subscribe(null, (error) => {
              try {
                expect(error.message).to.equal(invalidQueryMessage);
                done();
              } catch (e) {
                done(e);
              }
            });
        });

        it('should return the count for the collection', (done) => {
          const onNextSpy = sinon.spy();
          return storeToTest.count()
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, 2, 3);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should return the count of the entities that match the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          const onNextSpy = sinon.spy();
          return storeToTest.count(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, 1, 1);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('find()', function () {

        it('should throw an error if the query argument is not an instance of the Query class', function (done) {
          storeToTest.find({})
            .subscribe(null, (error) => {
              try {
                expect(error.message).to.equal(invalidQueryMessage);
                done();
              } catch (e) {
                done(e);
              }
            });
        });

        it('should return all the entities from the backend', (done) => {
          const onNextSpy = sinon.spy();
          return storeToTest.find()
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, [entity1, entity2], [entity1, entity2, entity3])
                return retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, entity3)
                  .then((result) => {
                    if (result) {
                      result = deleteEntityMetadata(result);
                    }
                    expect(result).to.deep.equal(dataStoreType === Kinvey.DataStoreType.Cache ? entity3 : undefined);
                    done();
                  }).catch(done);
              } catch (error) {
                done(error);
              }
            });
        });

        it('should find the entities that match the query', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          return storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, [entity2], [entity2])
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('findById()', function () {
        it('should throw a NotFoundError if the id argument does not exist', (done) => {
          const entityId = randomString();
          return storeToTest.findById(entityId).toPromise()
            .catch((error) => {
              expect(error.name).to.contain(notFoundErrorName);
              done();
            }).catch(done);
        });

        it('should return the entity that matches the id argument', (done) => {
          const onNextSpy = sinon.spy();
          return storeToTest.findById(entity2._id)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, entity2, entity2)
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('save()', function () {

        it('should throw an error when trying to save an array of entities', (done) => {
          return storeToTest.save([entity1, entity2])
            .catch((error) => {
              expect(error.message).to.equal('Unable to create an array of entities.');
              done();
            }).catch(done);
        });

        it('should create a new entity without _id', (done) => {
          let newEntity = {
            customProperty: randomString()
          };
          return storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.exist;
              expect(createdEntity.customProperty).to.equal(newEntity.customProperty);
              newEntity._id = createdEntity._id;
              return validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              done();
            }).catch((err) => {
              done(err);
            });
        });

        it('should create a new entity using its _id', (done) => {
          const newEntity = {
            _id: randomString(),
            customProperty: randomString()
          };
          return storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.equal(newEntity._id);
              expect(createdEntity.customProperty).to.equal(newEntity.customProperty);
              return validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              done();
            }).catch((err) => {
              done(err);
            });
        });

        it('should update an existing entity', (done) => {
          const entityToUpdate = {
            _id: entity1._id,
            customProperty: entity1.customProperty,
            newProperty: randomString()
          };
          return storeToTest.save(entityToUpdate)
            .then((updatedEntity) => {
              expect(updatedEntity._id).to.equal(entity1._id);
              expect(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
              return validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty')
            })
            .then(() => {
              done();
            }).catch(done);

        });
      });

      describe('removeById()', function () {
        it('should throw an error if the id argument does not exist', (done) => {
          return storeToTest.removeById(randomString())
            .catch((error) => {
              if (dataStoreType === Kinvey.DataStoreType.Network) {
                expect(error.name).to.contain(notFoundErrorName);
              }
              else {
                expect(error).to.exist
              }
              done();
            }).catch(done);
        });

        it('should remove only the entity that matches the id argument', (done) => {
          const newEntity = {
            _id: randomString()
          };
          let remainingCount;

          return storeToTest.count().toPromise()
            .then((count) => {
              remainingCount = count;
              return storeToTest.save(newEntity)
            })
            .then(() => {
              return storeToTest.removeById(newEntity._id)
            })
            .then((result) => {
              expect(result.count).to.equal(1);
              const onNextSpy = sinon.spy();
              const query = new Kinvey.Query();
              query.equalTo('_id', newEntity._id);
              return storeToTest.count(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    validateReadResult(dataStoreType, onNextSpy, 0, 0)
                    return storeToTest.count().toPromise()
                      .then((count) => {
                        expect(count).to.equal(remainingCount);
                        done();
                      }).catch(done);
                  } catch (error) {
                    done(error);
                  }
                });
            });
        });
      });

      describe('remove()', function () {

        it('should throw an error for an invalid query', (done) => {
          return storeToTest.remove({})
            .catch((error) => {
              expect(error.message).to.equal(invalidQueryMessage);
              done();
            }).catch(done);
        });

        it('should remove all entities that match the query', (done) => {
          const newEntity = {
            customProperty: entity2.customProperty
          };
          const query = new Kinvey.Query();
          query.equalTo('customProperty', entity2.customProperty);
          let initialCount;

          return storeToTest.save(newEntity)
            .then(() => {
              return storeToTest.count().toPromise()
            })
            .then((count) => {
              initialCount = count;
              return storeToTest.remove(query)
            })
            .then((result) => {
              expect(result.count).to.equal(2);
              const onNextSpy = sinon.spy();
              return storeToTest.count(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    validateReadResult(dataStoreType, onNextSpy, 0, 0)
                    return storeToTest.count().toPromise()
                      .then((count) => {
                        expect(count).to.equal(initialCount - 2);
                        done();
                      }).catch(done);
                  } catch (error) {
                    done(error);
                  }
                });
            })
        });
      });
    });
  });
}