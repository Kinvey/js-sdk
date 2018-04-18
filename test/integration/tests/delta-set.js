function testFunc() {
    let dataStoreTypes = [Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
    let deltaCollectionName = externalConfig.deltaCollectionName;
    let deltaNetworkStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Network);
    let syncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync);
    let cacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache);
    let deltaSyncStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Sync, { useDeltaSet: true });
    let deltaCacheStore = Kinvey.DataStore.collection(deltaCollectionName, Kinvey.DataStoreType.Cache, { useDeltaSet: true });

    const validatePullOperation = (result, expectedItems, expectedPulledItemsCount) => {
        expect(result).to.equal(expectedPulledItemsCount || expectedItems.length);
        return syncStore.find().toPromise()
            .then((result) => {
                expectedItems.forEach((entity) => {
                    const cachedEntity = _.find(result, e => e._id === entity._id);
                    expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
                });
            });
    }

    const validateNewPullOperation = (result, expectedPulledItems, expectedDeletedItems) => {
        expect(result).to.equal(expectedDeletedItems.length + expectedPulledItems.length);
        return syncStore.find().toPromise()
            .then((result) => {
                expectedPulledItems.forEach((entity) => {
                    const cachedEntity = _.find(result, e => e._id === entity._id);
                    expect(utilities.deleteEntityMetadata(cachedEntity)).to.deep.equal(entity);
                });

                expectedDeletedItems.forEach((entity) => {
                    const deletedEntity = _.find(result, e => e._id === entity._id);
                    expect(deletedEntity).to.equal(undefined);
                });
            });
    }

    const validateFindOperation = (result, expectedItems, query) => {
        expect(result.length).to.equal(expectedItems.length);
        return syncStore.find(query || new Kinvey.Query()).toPromise()
            .then((result) => {
                expectedItems.forEach((entity) => {
                    const cachedEntity = _.find(result, e.e._id === entity._id);
                    expect(utilities.deleteEntityMetadata(cachedEntity).to.deep.equal(entity));
                });
            });
    }

    dataStoreTypes.forEach((currentDataStoreType) => {
        describe(`${currentDataStoreType} Deltaset tests`, () => {
            let conditionalDescribe = currentDataStoreType === Kinvey.DataStoreType.Sync ? describe.skip : describe;
            describe('pull', () => {
                const dataStoreType = currentDataStoreType;
                const entity1 = utilities.getEntity(utilities.randomString());
                const entity2 = utilities.getEntity(utilities.randomString());
                const entity3 = utilities.getEntity(utilities.randomString());
                const createdUserIds = [];
                let deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });

                before((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => Kinvey.User.signup())
                        .then((user) => {
                            createdUserIds.push(user.data._id);
                            done();
                        })
                        .catch(done);
                });

                beforeEach((done) => {
                    utilities.cleanUpCollectionData(deltaCollectionName)
                        .then(() => deltaNetworkStore.save(entity1))
                        .then(() => deltaNetworkStore.save(entity2))
                        .then(() => done())
                        .catch(done);
                });

                after((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items without changes', (done) => {
                    deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with created item', (done) => {
                    deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(entity3))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with auto-pagination', (done) => {
                    deltaStoreToTest.pull(new Kinvey.Query(), { autoPagination: true })
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(entity3))
                        .then(() => deltaStoreToTest.pull(new Kinvey.Query(), { autoPagination: true }))
                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with deleted item', (done) => {
                    deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaNetworkStore.removeById(entity2._id))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [entity1]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with updated item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(updatedEntity))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [entity1, updatedEntity]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with updated and deleted item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    deltaStoreToTest.pull()
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(updatedEntity))
                        .then(() => deltaNetworkStore.removeById(entity1._id))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [updatedEntity]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with query with updated item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let updatedEntity = _.clone(entity5);
                    updatedEntity.numberField = 5;
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaNetworkStore.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.pull(query)
                            .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
                            .then(() => deltaNetworkStore.save(updatedEntity))
                            .then(() => deltaStoreToTest.pull(query))
                            .then((result) => validatePullOperation(result, [entity4, updatedEntity, entity6]))
                            .then(() => done()))
                        .catch(done);
                });

                it('should return correct number of items with query with deleted item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaNetworkStore.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.pull(query)
                            .then((result) => validatePullOperation(result, [entity4, entity5, entity6]))
                            .then(() => deltaNetworkStore.removeById(entity5._id))
                            .then(() => deltaStoreToTest.pull(query))
                            .then((result) => validatePullOperation(result, [entity4, entity6]))
                            .then(() => done()))
                        .catch(done);
                });
            });

            describe('sync', () => {
                const dataStoreType = currentDataStoreType;
                const entity1 = utilities.getEntity(utilities.randomString());
                const entity2 = utilities.getEntity(utilities.randomString());
                const entity3 = utilities.getEntity(utilities.randomString());
                const createdUserIds = [];
                let deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });

                before((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => Kinvey.User.signup())
                        .then((user) => {
                            createdUserIds.push(user.data._id);
                            done();
                        })
                        .catch(done);
                });

                beforeEach((done) => {
                    utilities.cleanUpCollectionData(deltaCollectionName)
                        .then(() => deltaNetworkStore.save(entity1))
                        .then(() => deltaNetworkStore.save(entity2))
                        .then(() => done())
                        .catch(done);
                });

                after((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items without changes', (done) => {
                    deltaStoreToTest.sync()
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaStoreToTest.pull())
                        .then((result) => validatePullOperation(result, [entity1, entity2]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with created item', (done) => {
                    deltaStoreToTest.sync()
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(entity3))
                        .then(() => deltaStoreToTest.sync())
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2, entity3]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with auto-pagination', (done) => {
                    deltaStoreToTest.sync(new Kinvey.Query(), { autoPagination: true })
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(entity3))
                        .then(() => deltaStoreToTest.sync(new Kinvey.Query(), { autoPagination: true }))
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2, entity3]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with deleted item', (done) => {
                    deltaStoreToTest.sync()
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaNetworkStore.removeById(entity2._id))
                        .then(() => deltaStoreToTest.sync())
                        .then((result) => validatePullOperation(result.pull, [entity1]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with updated item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    deltaStoreToTest.sync()
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(updatedEntity))
                        .then(() => deltaStoreToTest.sync())
                        .then((result) => validatePullOperation(result.pull, [entity1, updatedEntity]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with updated and deleted item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    deltaStoreToTest.sync()
                        .then((result) => validatePullOperation(result.pull, [entity1, entity2]))
                        .then(() => deltaNetworkStore.save(updatedEntity))
                        .then(() => deltaNetworkStore.removeById(entity1._id))
                        .then(() => deltaStoreToTest.sync())
                        .then((result) => validatePullOperation(result.pull, [updatedEntity]))
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items with query with updated item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let updatedEntity = _.clone(entity5);
                    updatedEntity.numberField = 5;
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaNetworkStore.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.sync(query)
                            .then((result) => validatePullOperation(result.pull, [entity4, entity5, entity6]))
                            .then(() => deltaNetworkStore.save(updatedEntity))
                            .then(() => deltaStoreToTest.sync(query))
                            .then((result) => validatePullOperation(result.pull, [entity4, updatedEntity, entity6]))
                            .then(() => done()))
                        .catch(done);
                });

                it('should return correct number of items with query with deleted item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaNetworkStore.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.sync(query)
                            .then((result) => validatePullOperation(result.pull, [entity4, entity5, entity6]))
                            .then(() => deltaNetworkStore.removeById(entity5._id))
                            .then(() => deltaStoreToTest.sync(query))
                            .then((result) => validatePullOperation(result.pull, [entity4, entity6]))
                            .then(() => done()))
                        .catch(done);
                });
            });

            conditionalDescribe('find', () => {
                const dataStoreType = currentDataStoreType;
                const entity1 = utilities.getEntity(utilities.randomString());
                const entity2 = utilities.getEntity(utilities.randomString());
                const entity3 = utilities.getEntity(utilities.randomString());
                const createdUserIds = [];
                let deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });

                before((done) => {

                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => Kinvey.User.signup())
                        .then((user) => {
                            createdUserIds.push(user.data._id);
                            done();
                        })
                        .catch(done);
                });

                beforeEach((done) => {
                    utilities.cleanUpCollectionData(deltaCollectionName)
                        .then(() => deltaStoreToTest.save(entity1))
                        .then(() => deltaNetworkStore.save(entity2))
                        .then(() => done())
                        .catch(done);
                });

                after((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => done())
                        .catch(done);
                });

                it('should return correct number of items without changes', (done) => {
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find()
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaStoreToTest.find()
                                    .subscribe(anotherSpy, done, () => {
                                        try {
                                            utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2], true);
                                            done();
                                        }
                                        catch (error) {
                                            done(error);
                                        }
                                    })
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });


                it('should return correct number of items with created item', (done) => {
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find()
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaNetworkStore.save(entity3)
                                    .then(() => deltaStoreToTest.find()
                                        .subscribe(anotherSpy, done, () => {
                                            try {
                                                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                                                done();
                                            }
                                            catch (error) {
                                                done(error);
                                            }
                                        }))
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });

                it('should return correct number of items with auto-pagination', (done) => {
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find(new Kinvey.Query(), { autoPagination: true })
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaNetworkStore.save(entity3)
                                    .then(() => deltaStoreToTest.find(new Kinvey.Query(), { autoPagination: true })
                                        .subscribe(anotherSpy, done, () => {
                                            try {
                                                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                                                done();
                                            }
                                            catch (error) {
                                                done(error);
                                            }
                                        }))
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });

                it('should return correct number of items with deleted item', (done) => {
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find()
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaNetworkStore.removeById(entity1._id)
                                    .then(() => deltaStoreToTest.find()
                                        .subscribe(anotherSpy, done, () => {
                                            try {
                                                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity2], true);
                                                done();
                                            }
                                            catch (error) {
                                                done(error);
                                            }
                                        }))
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });

                it('should return correct number of items with updated item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find()
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaNetworkStore.save(updatedEntity)
                                    .then(() => deltaStoreToTest.find()
                                        .subscribe(anotherSpy, done, () => {
                                            try {
                                                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [entity1, updatedEntity], true);
                                                done();
                                            }
                                            catch (error) {
                                                done(error);
                                            }
                                        }))
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });

                it('should return correct number of items with updated and deleted item', (done) => {
                    let updatedEntity = _.clone(entity2);
                    updatedEntity.textField = utilities.randomString();
                    const onNextSpy = sinon.spy();
                    deltaStoreToTest.find()
                        .subscribe(onNextSpy, done, () => {
                            try {
                                utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity1], [entity1, entity2], true);
                                const anotherSpy = sinon.spy();
                                deltaNetworkStore.save(updatedEntity)
                                    .then(() => deltaNetworkStore.removeById(entity1._id))
                                    .then(() => deltaStoreToTest.find()
                                        .subscribe(anotherSpy, done, () => {
                                            try {
                                                utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity1, entity2], [updatedEntity], true);
                                                done();
                                            }
                                            catch (error) {
                                                done(error);
                                            }
                                        }))
                            }
                            catch (error) {
                                done(error);
                            }
                        });
                });

                it('should return correct number of items with query with updated item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let updatedEntity = _.clone(entity5);
                    updatedEntity.numberField = 5;
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    const onNextSpy = sinon.spy();
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaStoreToTest.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.find(query)
                            .subscribe(onNextSpy, done, () => {
                                try {
                                    utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);
                                    const anotherSpy = sinon.spy();
                                    deltaNetworkStore.save(updatedEntity)
                                        .then(() => deltaStoreToTest.find(query)
                                            .subscribe(anotherSpy, done, () => {
                                                try {
                                                    utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, updatedEntity, entity6], true);
                                                    done();
                                                }
                                                catch (error) {
                                                    done(error);
                                                }
                                            }))
                                }
                                catch (error) {
                                    done(error);
                                }
                            }));
                });

                it('should return correct number of items with query with deleted item', (done) => {
                    let entity4 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity5 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let entity6 = utilities.getEntity(utilities.randomString(), "queryValue");
                    let updatedEntity = _.clone(entity5);
                    updatedEntity.numberField = 5;
                    let query = new Kinvey.Query();
                    query.equalTo('textField', 'queryValue');
                    const onNextSpy = sinon.spy();
                    deltaNetworkStore.save(entity4)
                        .then(() => deltaStoreToTest.save(entity5))
                        .then(() => deltaNetworkStore.save(entity6))
                        .then(() => deltaStoreToTest.find(query)
                            .subscribe(onNextSpy, done, () => {
                                try {
                                    utilities.validateReadResult(currentDataStoreType, onNextSpy, [entity5], [entity4, entity5, entity6], true);
                                    const anotherSpy = sinon.spy();
                                    deltaNetworkStore.removeById(entity5._id)
                                        .then(() => deltaStoreToTest.find(query)
                                            .subscribe(anotherSpy, done, () => {
                                                try {
                                                    utilities.validateReadResult(currentDataStoreType, anotherSpy, [entity4, entity5, entity6], [entity4, entity6], true);
                                                    done();
                                                }
                                                catch (error) {
                                                    done(error);
                                                }
                                            }))
                                }
                                catch (error) {
                                    done(error);
                                }
                            }));
                });
            });

            describe('when switching stores', () => {
                const dataStoreType = currentDataStoreType;
                const entity1 = utilities.getEntity(utilities.randomString());
                const entity2 = utilities.getEntity(utilities.randomString());
                const entity3 = utilities.getEntity(utilities.randomString());
                const entity4 = utilities.getEntity(utilities.randomString());
                const createdUserIds = [];
                let deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });

                before((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => Kinvey.User.signup())
                        .then((user) => {
                            createdUserIds.push(user.data._id);
                            done();
                        })
                        .catch(done);
                });

                beforeEach((done) => {
                    utilities.cleanUpCollectionData(deltaCollectionName)
                        .then(() => deltaNetworkStore.save(entity1))
                        .then(() => deltaNetworkStore.save(entity2))
                        .then(() => done())
                        .catch(done);
                });

                after((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => done())
                        .catch(done);
                });

                if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
                    it('should use deltaset consistently when switching from sync to cache', (done) => {
                        deltaStoreToTest.pull()
                            .then((result) => validatePullOperation(result, [entity1, entity2]))
                            .then(() => deltaNetworkStore.save(entity3))
                            .then(() => deltaStoreToTest.pull())
                            .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                            .then(() => deltaNetworkStore.save(entity4))
                            .then(() => deltaCacheStore.pull())
                            .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
                            .then(() => done())
                            .catch(done);
                    });
                }

                if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
                    it('should use deltaset consistently when switching from cache to sync', (done) => {
                        deltaStoreToTest.pull()
                            .then((result) => validatePullOperation(result, [entity1, entity2]))
                            .then(() => deltaNetworkStore.save(entity3))
                            .then(() => deltaStoreToTest.pull())
                            .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                            .then(() => deltaNetworkStore.save(entity4))
                            .then(() => deltaSyncStore.pull())
                            .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
                            .then(() => done())
                            .catch(done);
                    });
                }

                if (currentDataStoreType === Kinvey.DataStoreType.Sync) {
                    it('should use deltaset consistently when switching from network to sync', (done) => {
                        let onNextSpy = sinon.spy();
                        deltaNetworkStore.find()
                            .subscribe(onNextSpy, done, () => {
                                try {
                                    utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2]);
                                    deltaNetworkStore.save(entity3)
                                        .then(() => deltaStoreToTest.pull())
                                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                                        .then(() => deltaNetworkStore.save(entity4))
                                        .then(() => deltaSyncStore.pull())
                                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
                                        .then(() => done())
                                        .catch(done);
                                }
                                catch (error) {
                                    done(error);
                                }
                            });
                    })
                }

                if (currentDataStoreType === Kinvey.DataStoreType.Cache) {
                    it('should use deltaset consistently when switching from network to cache', (done) => {
                        let onNextSpy = sinon.spy();
                        deltaNetworkStore.find()
                            .subscribe(onNextSpy, done, () => {
                                try {
                                    utilities.validateReadResult(Kinvey.DataStoreType.Network, onNextSpy, [entity1], [entity1, entity2]);
                                    deltaNetworkStore.save(entity3)
                                        .then(() => deltaStoreToTest.pull())
                                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                                        .then(() => deltaNetworkStore.save(entity4))
                                        .then(() => deltaSyncStore.pull())
                                        .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
                                        .then(() => done())
                                        .catch(done);
                                }
                                catch (error) {
                                    done(error);
                                }
                            });
                    })
                }
            });

            describe('when clearing cache', () => {
                const dataStoreType = currentDataStoreType;
                const entity1 = utilities.getEntity(utilities.randomString());
                const entity2 = utilities.getEntity(utilities.randomString());
                const entity3 = utilities.getEntity(utilities.randomString());
                const entity4 = utilities.getEntity(utilities.randomString());
                const createdUserIds = [];
                let deltaStoreToTest = Kinvey.DataStore.collection(deltaCollectionName, currentDataStoreType, { useDeltaSet: true });

                before((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => Kinvey.User.signup())
                        .then((user) => {
                            createdUserIds.push(user.data._id);
                            done();
                        })
                        .catch(done);
                });

                beforeEach((done) => {
                    utilities.cleanUpCollectionData(deltaCollectionName)
                        .then(() => deltaNetworkStore.save(entity1))
                        .then(() => deltaNetworkStore.save(entity2))
                        .then(() => done())
                        .catch(done);
                });

                after((done) => {
                    utilities.cleanUpAppData(deltaCollectionName, createdUserIds)
                        .then(() => done())
                        .catch(done);
                });

                it('should send regular GET after clearCache()', (done)=>{
                    deltaStoreToTest.pull()
                    .then((result) => validatePullOperation(result, [entity1, entity2]))
                    .then(() => deltaNetworkStore.save(entity3))
                    .then(() => deltaStoreToTest.pull())
                    .then((result) => validatePullOperation(result, [entity1, entity2, entity3]))
                    .then(() => Kinvey.DataStore.clearCache())
                    .then(() => deltaNetworkStore.save(entity4))
                    .then(() => deltaStoreToTest.pull())
                    .then((result) => validatePullOperation(result, [entity1, entity2, entity3, entity4]))
                    .then(() => deltaNetworkStore.removeById(entity3._id))
                    .then(() => deltaStoreToTest.pull())
                    .then((result) => validatePullOperation(result, [entity1, entity2, entity4]))
                    .then(() => done())
                    .catch(done);
                });
            });
        });
    });
}

runner.run(testFunc);