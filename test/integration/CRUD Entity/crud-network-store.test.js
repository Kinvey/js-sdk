runner.run(testFunc);

function testFunc() {

    const invalidQueryMessage = 'Invalid query. It must be an instance of the Query class.';

    const assertEntityMetadata = (entity) => {

        expect(entity._kmd.lmt).to.exist;
        expect(entity._kmd.ect).to.exist;
        expect(entity._acl.creator).to.exist;
    }

    const cleanCollectionData = (collectionName, done) => {
        const store = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
        return store.find().toPromise()
            .then((entities) => {
                async.each(entities.map(a => a._id), (entityId, callback) => {
                    const query = new Kinvey.Query();
                    query.equalTo('_id', entityId);
                    return store.remove(query)
                        .then(callback)
                }, () => {
                    done();
                });
            }).catch(done);
    }

    describe('Network Store', function() {

        const collectionName = 'Books';
        const store = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
        const entity1 = {
            _id: randomString()
        };
        const entity2 = {
            _id: randomString()
        };

        before((done) => {

            Kinvey.initialize({
                appKey: externalConfig.appKey,
                appSecret: externalConfig.appSecret
            });

            Kinvey.User.signup()
                .then(() => {
                    cleanCollectionData(collectionName, done)
                })
                .then(() => {
                    return store.save(entity1)
                })
                .then(() => {
                    return store.save(entity2)
                })
                .then(() => {
                    done();
                })
        });

        describe('find()', function() {
            it('should throw an error if the query argument is not an instance of the Query class', function(done) {
                store.find({})
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
                return store.find().toPromise()
                    .then((entities) => {
                        expect(entities).to.be.an('array');
                        expect(entities.length).to.equal(2);
                        assertEntityMetadata(_.find(entities, { '_id': entity1._id }));
                        assertEntityMetadata(_.find(entities, { '_id': entity2._id }));
                        done();
                    }).catch(done);
            });

            it('should find the entities that match the query', (done) => {
                const query = new Kinvey.Query();
                query.equalTo('_id', entity2._id);
                return store.find(query).toPromise()
                    .then((entity) => {
                        expect(entity).to.be.an('array');
                        expect(entity.length).to.equal(1);
                        assertEntityMetadata(_.find(entity, { '_id': entity2._id }));
                        done();
                    }).catch(done);
            });
        });

        describe('findById()', function() {
            it('should throw a NotFoundError if the id argument does not exist', (done) => {
                const entityId = randomString();
                return store.findById(entityId).toPromise()
                    .catch((error) => {
                        expect(error.message).to.contain('This entity not found in the collection');
                        done();
                    }).catch(done);
            });

            it('should return the entity that matches the id argument', (done) => {
                return store.findById(entity2._id).toPromise()
                    .then((entity) => {
                        expect(entity._id).to.equal(entity2._id)
                        assertEntityMetadata(entity);
                        done();
                    }).catch(done);
            });
        });

        describe('count()', function() {
            it('should throw an error for an invalid query', (done) => {
                store.count({})
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
                return store.count().toPromise()
                    .then((count) => {
                        expect(count).to.equal(2);
                        done();
                    }).catch(done);
            });

            it('should return the count of the entities that match the query', (done) => {
                const query = new Kinvey.Query();
                query.equalTo('_id', entity2._id);
                return store.count(query).toPromise()
                    .then((count) => {
                        expect(count).to.equal(1);
                        done();
                    }).catch(done);
            });
        });
    });
}