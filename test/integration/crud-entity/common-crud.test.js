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

      const createdUserIds = [];

      before((done) => {

        Kinvey.initialize({
          appKey: appKey,
          appSecret: appSecret
        });

        Kinvey.User.signup()
          .then((user) => {
            createdUserIds.push(user.data._id);
            //store for setup
            networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
            //store to test
            storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
            return cleanUpCollectionData(collectionName, done)
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
        deleteUsers(createdUserIds)
          .then(() => {
            return Kinvey.User.logout()
          })
          .then(() => done())
          .catch(done)
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

        it('should return all the entities', (done) => {
          const onNextSpy = sinon.spy();
          return storeToTest.find()
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, [entity1, entity2], [entity1, entity2, entity3], true)
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

        it('should return undefined if an id is not provided', (done) => {
          return storeToTest.findById().toPromise()
            .then((result) => {
              expect(result).to.be.undefined;
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

      describe('find with modifiers', function () {
        let entities = [];
        const dataCount = 10;
        before((done) => {

          for (let i = 0; i < dataCount; i++) {
            entities.push(getSingleEntity());
          }

          cleanUpCollectionData(collectionName, done)
            .then(() => {
              return createData(collectionName, entities)
            })
            .then((result) => {
              entities = result;
              done();
            }).catch(done);
        });

        it('should sort ascending and skip correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.skip = dataCount - 2;
          query.ascending('_id');
          const expectedEntities = [entities[dataCount - 2], entities[dataCount - 1]];
          return storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should sort descending and limit correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.limit = 2;
          query.descending('_id');
          const expectedEntities = [entities[dataCount - 1], entities[dataCount - 2]];
          return storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should skip and limit correctly', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.limit = 1;
          query.skip = dataCount - 2;
          query.ascending('_id');
          const expectedEntity = entities[dataCount - 2];
          return storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        //skipped because of a bug for syncStore and different behaviour of fields for Sync and Network
        it.skip('with fields should return only the specified fields', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.limit = 1;
          query.skip = dataCount - 2;
          query.fields = ['customProperty']
          query.ascending('_id');
          const expectedEntity = { 'customProperty': entities[dataCount - 2].customProperty };
          return storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('Querying', function () {
        let entities = [];
        const dataCount = 10;
        let stringPropertyName = 'customProperty';
        let numberPropertyName = 'numberProperty';
        let onNextSpy;
        let query;

        before((done) => {

          for (let i = 0; i < dataCount; i++) {
            entities.push(getSingleEntity(null, `${i}_test`, i));
          }

          cleanUpCollectionData(collectionName, done)
            .then(() => {
              return createData(collectionName, entities)
            })
            .then((result) => {
              entities = _.sortBy(result, numberPropertyName);
              done();
            }).catch(done);
        });

        beforeEach((done) => {
          onNextSpy = sinon.spy();
          query = new Kinvey.Query();
          done();
        });

        describe('Operators', function () {

          it('query.equalTo', (done) => {
            query.equalTo(stringPropertyName, entities[5][stringPropertyName]);
            const expectedEntities = [entities[5]];
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.notEqualTo', (done) => {
            query.notEqualTo(stringPropertyName, entities[5][stringPropertyName]);
            const expectedEntities = entities.filter(entity => entity[stringPropertyName] != entities[5][stringPropertyName]);
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.greaterThan', (done) => {
            query.greaterThan(numberPropertyName, entities[dataCount - 2][numberPropertyName]);
            const expectedEntities = [entities[dataCount - 1]];
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.greaterThanOrEqualTo', (done) => {
            query.greaterThanOrEqualTo(numberPropertyName, entities[dataCount - 2][numberPropertyName]);
            const expectedEntities = [entities[dataCount - 2], entities[dataCount - 1]];
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.lessThan', (done) => {
            query.lessThan(numberPropertyName, entities[2][numberPropertyName]);
            const expectedEntities = [entities[0], entities[1]];
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('query.lessThanOrEqualTo', (done) => {
            query.lessThanOrEqualTo(numberPropertyName, entities[1][numberPropertyName]);
            const expectedEntities = [entities[0], entities[1]];
            return storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });
      });

      describe('save()', function () {

        beforeEach((done) => {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.clearSync()
              .then(() => {
                done()
              });
          }
          else {
            done();
          }
        });

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
              if (dataStoreType === Kinvey.DataStoreType.Sync) {
                expect(createdEntity._kmd.local).to.be.true;
              }
              else {
                assertEntityMetadata(createdEntity);
              }
              newEntity._id = createdEntity._id;
              return validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              validatePendingSyncCount(dataStoreType, collectionName, 1, done)
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
              validatePendingSyncCount(dataStoreType, collectionName, 1, done)
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

        before((done) => {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.clearSync()
              .then(() => {
                done()
              })
          }
          else {
            done();
          }
        });

        it('should throw an error for an invalid query', (done) => {
          storeToTest.remove({})
            .catch((error) => {
              expect(error.message).to.equal(invalidQueryMessage);
              done();
            }).catch(done);
        });

        it('should remove all entities that match the query', (done) => {
          const newEntity = getSingleEntity();
          const query = new Kinvey.Query();
          query.equalTo('customProperty', newEntity.customProperty);
          let initialCount;
          createData(collectionName, [newEntity, newEntity])
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
                        //validatePendingSyncCount(dataStoreType, collectionName, 0, done)
                      }).catch(done);
                  } catch (error) {
                    done(error);
                  }
                });
            }).catch(done);
        });

        it('should return a { count: 0 } when no entities are removed', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', randomString());
          return storeToTest.remove(query)
            .then((result) => {
              expect(result.count).to.equal(0);
              done()
            }).catch(done);
        });
      });
    });
  });
}