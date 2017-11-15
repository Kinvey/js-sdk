common = {

  uid: (size = 10) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < size; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  },
  randomString: (size = 18, prefix = '') => {
    return `${prefix}${common.uid(size)}`;
  },
  getSingleEntity: (_id, textValue, numberValue, array) => {
    let entity = {
      textField: textValue || common.randomString(),
      numberField: numberValue || numberValue === 0 ? numberValue : Math.random(),
      arrayField: array || [common.randomString(), common.randomString()]
    };
    if (_id) {
      entity._id = _id;
    }
    return entity;
  },
  createData: (collectionName, arrayOfEntities) => {
    const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
    const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
    return Promise.all(arrayOfEntities.map(entity => {
      return networkStore.save(entity)
    }))
      .then(() => syncStore.pull())
      .then(result => _.sortBy(common.deleteEntityMetadata(result), '_id'));
  },
  deleteUsers: (userIds) => {
    return Promise.all(userIds.map(userId => {
      return Kinvey.User.remove(userId, {
        hard: true
      });
    }));
  },
  assertEntityMetadata: (arrayOfEntities) => {
    const entities = [].concat(arrayOfEntities);
    entities.forEach((entity) => {
      expect(entity._kmd.lmt).to.exist;
      expect(entity._kmd.ect).to.exist;
      expect(entity._acl.creator).to.exist;
    });
  },
  deleteEntityMetadata: (arrayOfEntities) => {
    if (arrayOfEntities instanceof Array) {
      arrayOfEntities.forEach((entity) => {
        delete entity['_kmd'];
        delete entity['_acl'];
      });
    }
    else {
      delete arrayOfEntities['_kmd'];
      delete arrayOfEntities['_acl'];
    }
    return arrayOfEntities;
  },
  validateReadResult: (dataStoreType, spy, cacheExpectedEntities, backendExpectedEntities, sortBeforeCompare) => {
    let firstCallArgs = spy.firstCall.args[0];
    let secondCallArgs;
    if (dataStoreType === Kinvey.DataStoreType.Cache) {
      secondCallArgs = spy.secondCall.args[0];
    }
    if (!_.isNumber(cacheExpectedEntities) && [].concat(cacheExpectedEntities)[0].hasOwnProperty('_id')) {
      common.deleteEntityMetadata(firstCallArgs);
      if (sortBeforeCompare) {
        firstCallArgs = _.sortBy(firstCallArgs, '_id');
        cacheExpectedEntities = _.sortBy(cacheExpectedEntities, '_id');
        backendExpectedEntities = _.sortBy(backendExpectedEntities, '_id');
      }
      if (secondCallArgs) {
        common.deleteEntityMetadata(secondCallArgs);
        if (sortBeforeCompare) {
          secondCallArgs = _.sortBy(secondCallArgs, '_id');
        }
      }
    }

    if (dataStoreType === Kinvey.DataStoreType.Network) {
      expect(spy.calledOnce).to.be.true;
      expect(firstCallArgs).to.deep.equal(backendExpectedEntities);
    }
    else if (dataStoreType === Kinvey.DataStoreType.Sync) {
      expect(spy.calledOnce).to.be.true;
      expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
    }
    else {
      expect(spy.calledTwice).to.be.true;
      expect(firstCallArgs).to.deep.equal(cacheExpectedEntities);
      expect(secondCallArgs).to.deep.equal(backendExpectedEntities);
    }
  },
  retrieveEntity: (collectionName, dataStoreType, entity, searchField) => {

    const store = Kinvey.DataStore.collection(collectionName, dataStoreType);
    const query = new Kinvey.Query();
    const propertyToSearchBy = searchField || '_id';
    query.equalTo(propertyToSearchBy, entity[propertyToSearchBy]);
    return store.find(query).toPromise()
      .then(result => result[0])
  },
  validatePendingSyncCount: (dataStoreType, collectionName, itemsForSyncCount, done) => {
    if (dataStoreType !== Kinvey.DataStoreType.Network) {
      let expectedCount = 0;
      if (dataStoreType === Kinvey.DataStoreType.Sync) {
        expectedCount = itemsForSyncCount;
      }
      const store = Kinvey.DataStore.collection(collectionName, dataStoreType);
      return store.pendingSyncCount()
        .then((syncCount) => {
          expect(syncCount).to.equal(expectedCount);
          done();
        }).catch(done);
    }
    else {
      done();
    }
  },
  validateEntity: (dataStoreType, collectionName, expectedEntity, searchField) => {
    return new Promise((resolve, reject) => {
      let entityFromCache;
      let entityFromBackend;

      return common.retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, expectedEntity, searchField)
        .then((result) => {
          if (result) {
            entityFromCache = common.deleteEntityMetadata(result);
          }
          return common.retrieveEntity(collectionName, Kinvey.DataStoreType.Network, expectedEntity, searchField)
        })
        .then((result) => {
          if (result) {
            entityFromBackend = common.deleteEntityMetadata(result);
          }
          if (dataStoreType === Kinvey.DataStoreType.Network) {
            expect(entityFromCache).to.be.undefined
            expect(entityFromBackend).to.deep.equal(expectedEntity);
          }
          else if (dataStoreType === Kinvey.DataStoreType.Sync) {
            expect(entityFromCache).to.deep.equal(expectedEntity);
            expect(entityFromBackend).to.be.undefined
          }
          else {
            expect(entityFromCache).to.deep.equal(expectedEntity);
            expect(entityFromBackend).to.deep.equal(expectedEntity);
          }
          resolve();
        }).catch((err) => {
          reject(err);
        });
    });
  },
  cleanUpCollectionData: (collectionName, done) => {
    const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
    const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
    return networkStore.find().toPromise()
      .then((entities) => {
        if (entities && entities.length > 0) {
          const query = new Kinvey.Query();
          query.contains('_id', entities.map(a => a._id));
          return networkStore.remove(query)
        }
      })
      .then(() => {
        return syncStore.clearSync()
      })
      .then(() => {
        return syncStore.clear()
      }).catch(done);
  }
}

if (typeof module === 'object') {
  module.exports = common;
}