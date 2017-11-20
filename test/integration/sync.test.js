runner.run(testFunc);

function testFunc() {
  const collectionName = externalConfig.collectionName;
  const appKey = externalConfig.appKey;
  const appSecret = externalConfig.appSecret;

  const dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];


  dataStoreTypes.forEach((currentDataStoreType) => {
    describe(`${currentDataStoreType} Sync Tests`, () => {

      let networkStore;
      let syncStore;
      let cacheStore;
      let storeToTest;
      const dataStoreType = currentDataStoreType;
      const entity1 = common.getSingleEntity(common.randomString());
      const entity2 = common.getSingleEntity(common.randomString());
      const entity3 = common.getSingleEntity(common.randomString());
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
          });
      });

      after((done) => {
        Kinvey.User.logout()
          .then(() => {
            return Kinvey.User.signup()
          })
          .then(() => {
            return common.deleteUsers(createdUserIds)
          })
          .then(() => {
            return common.cleanUpCollectionData(collectionName)
          })
          .then(() => {
            return Kinvey.User.logout()
          })
          .then(() => done())
          .catch(done)
      });

      describe('Pending sync queue operations', () => {

        beforeEach((done) => {
          common.cleanUpCollectionData(collectionName)
            .then(() => {
              return syncStore.save(entity1)
            })
            .then(() => {
              return syncStore.save(entity2)
            })
            .then(() => {
              return cacheStore.save(entity3)
            })
            .then(() => done())
            .catch(done)
        });

        it('pendingSyncCount() should return the count of the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncCount()
            .then((count) => {
              expect(count).to.equal(2);
              done();
            }).catch(done);
        });

        it('pendingSyncCount() should return the count of the entities, matching the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncCount(query)
            .then((count) => {
              expect(count).to.equal(1);
              done();
            }).catch(done);
        });

        it('clearSync() should clear the pending sync queue', (done) => {
          syncStore.clearSync()
            .then(() => {
              return storeToTest.pendingSyncCount()
            })
            .then((count) => {
              expect(count).to.equal(0);
              done();
            }).catch(done);
        });

        it('clearSync() should clear only the items, matching the query from the pending sync queue', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          syncStore.clearSync(query)
            .then(() => {
              return storeToTest.pendingSyncEntities()
            })
            .then((result) => {
              expect(result.length).to.equal(1);
              expect(result[0].entityId).to.equal(entity2._id);
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return only the entities waiting to be synced', (done) => {
          storeToTest.pendingSyncEntities()
            .then((entities) => {
              expect(entities.length).to.equal(2);
              entities.forEach((entity) => {
                expect(entity.collection).to.equal(externalConfig.collectionName);
                expect(entity.state.operation).to.equal('PUT');
                expect([entity1._id, entity2._id]).to.include(entity.entityId);
              })
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return only the entities, matching the query', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', entity1._id);
          storeToTest.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities.length).to.equal(1);
              expect(entities[0].entityId).to.equal(entity1._id);
              done();
            }).catch(done);
        });

        it('pendingSyncEntities() should return an empty array if there are no entities waiting to be synced', (done) => {
          syncStore.clearSync()
            .then(() => {
              return storeToTest.pendingSyncEntities()
            })
            .then((entities) => {
              expect(entities).to.be.an.empty.array;
              done();
            }).catch(done);
        });
      });

      describe('Sync operations', () => {

        describe('push()', () => {

          let updatedEntity;
          beforeEach((done) => {
            updatedEntity = Object.assign({ newProperty: common.randomString() }, entity2);
            //adding three items, eligible for sync
            common.cleanUpCollectionData(collectionName)
              .then(() => {
                return syncStore.save(entity1)
              })
              .then(() => {
                return cacheStore.save(entity2)
              })
              .then(() => {
                return cacheStore.save(entity3)
              })
              .then(() => {
                return syncStore.save(updatedEntity)
              })
              .then(() => {
                return syncStore.removeById(entity3._id)
              })
              .then(() => {
                //adding one item not eligible for sync
                return cacheStore.save({})
              })
              .then(() => done())
              .catch(done)
          });

          it('should push created/updated/deleted locally entities to the backend', (done) => {
            storeToTest.push()
              .then((result) => {
                expect(result.length).to.equal(3);

                result.forEach((record) => {
                  expect(record.operation).to.equal(record._id === entity3._id ? 'DELETE' : 'PUT');
                  expect([entity1._id, entity2._id, entity3._id]).to.include(record._id);
                  if (record.operation !== 'DELETE') {
                    common.assertEntityMetadata(record.entity);
                    common.deleteEntityMetadata(record.entity);
                    expect(record.entity).to.deep.equal(record._id === entity1._id ? entity1 : updatedEntity);
                  }
                  else {
                    expect(record.entity).to.not.exist;
                  }
                })
                return networkStore.find().toPromise()
              })
              .then((result) => {
                expect(result.length).to.equal(3);
                expect(_.find(result, (entity) => { return entity._id === entity3._id; })).to.not.exist;
                expect(_.find(result, (entity) => { return entity.newProperty === updatedEntity.newProperty; })).to.exist;
                let createdOnServer = _.find(result, (entity) => { return entity._id === entity1._id; });
                common.deleteEntityMetadata(createdOnServer);
                expect(createdOnServer).to.deep.equal(entity1);
                return storeToTest.pendingSyncCount()
              })
              .then((count) => {
                expect(count).to.equal(0);
                done();
              })
              .catch(done);
          });

          it('should push to the backend only the entities matching the query', (done) => {
            const query = new Kinvey.Query();
            query.equalTo('_id', entity1._id);
            storeToTest.push(query)
              .then((result) => {
                expect(result.length).to.equal(1);
                expect(result[0]._id).to.equal(entity1._id);

                return networkStore.find().toPromise()
                  .then((result) => {
                    expect(_.find(result, (entity) => { return entity._id === entity1._id; })).to.exist;
                    expect(_.find(result, (entity) => { return entity._id === entity3._id; })).to.exist;
                    done();
                  })
              }).catch(done);
          });
        });
      });
    });
  });
}