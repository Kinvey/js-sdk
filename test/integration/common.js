var uid = (size = 10) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

var randomString = (size = 18, prefix = '') => {
  return `${prefix}${uid(size)}`;
}

var getSingleEntity = (_id, customPropertyValue, numberPropertyValue) => {
  let entity = {
    customProperty: customPropertyValue || randomString(),
    numberProperty: numberPropertyValue || Math.random()
  };
  if (_id) {
    entity._id = _id;
  }
  return entity;
}

var createData = (collectionName, arrayOfEntities) => {
  const networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
  const syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
  return Promise.all(arrayOfEntities.map(entity => {
    return networkStore.save(entity)
  }))
    .then(() => syncStore.pull())
    .then(result => _.sortBy(deleteEntityMetadata(result), '_id'));
}

var deleteUsers = (userIds) => {
  return Promise.all(userIds.map(userId => {
    return Kinvey.User.remove(userId, {
      hard: true
    });
  }));
}

var assertEntityMetadata = (arrayOfEntities) => {
  const entities = [].concat(arrayOfEntities);
  entities.forEach((entity) => {
    expect(entity._kmd.lmt).to.exist;
    expect(entity._kmd.ect).to.exist;
    expect(entity._acl.creator).to.exist;
  });
}

var deleteEntityMetadata = (arrayOfEntities) => {
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
}

var validateReadResult = (dataStoreType, spy, cacheExpectedEntities, backendExpectedEntities, sortBeforeCompare) => {
  let firstCallArgs = spy.firstCall.args[0];
  let secondCallArgs;
  if (dataStoreType === Kinvey.DataStoreType.Cache) {
    secondCallArgs = spy.secondCall.args[0];
  }
  if (!_.isNumber(cacheExpectedEntities) && [].concat(cacheExpectedEntities)[0].hasOwnProperty('_id')) {
    deleteEntityMetadata(firstCallArgs);
    if (sortBeforeCompare) {
      firstCallArgs = _.sortBy(firstCallArgs, '_id');
      cacheExpectedEntities = _.sortBy(cacheExpectedEntities, '_id');
      backendExpectedEntities = _.sortBy(backendExpectedEntities, '_id');
    }
    if (secondCallArgs) {
      deleteEntityMetadata(secondCallArgs);
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
}

var retrieveEntity = (collectionName, dataStoreType, entity, searchField) => {

  const store = Kinvey.DataStore.collection(collectionName, dataStoreType);
  const query = new Kinvey.Query();
  const propertyToSearchBy = searchField || '_id';
  query.equalTo(propertyToSearchBy, entity[propertyToSearchBy]);
  return store.find(query).toPromise()
    .then(result => result[0])
}

var validatePendingSyncCount = (dataStoreType, collectionName, itemsForSyncCount, done) => {
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
}

var validateEntity = (dataStoreType, collectionName, expectedEntity, searchField) => {
  return new Promise((resolve, reject) => {
    let entityFromCache;
    let entityFromBackend;

    return retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, expectedEntity, searchField)
      .then((result) => {
        if (result) {
          entityFromCache = deleteEntityMetadata(result);
        }
        return retrieveEntity(collectionName, Kinvey.DataStoreType.Network, expectedEntity, searchField)
      })
      .then((result) => {
        if (result) {
          entityFromBackend = deleteEntityMetadata(result);
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
}

var cleanUpCollectionData = (collectionName, done) => {
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


if (typeof module === 'object') {
  module.exports = {};
}