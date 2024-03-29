import { expect } from 'chai';
import * as sinon from 'sinon';
import _ from 'lodash';
import * as Kinvey from '__SDK__';
import * as utilities from '../utils';
import * as externalConfig from '../config';
import * as Constants from '../constants';

const dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
const invalidQueryMessage = 'Invalid query. It must be an instance of the Query class.';
const notFoundErrorName = 'NotFoundError';
const { collectionName } = externalConfig;
const multiSaveErrorMessage = 'Unable to save an array of entities. Use "create" method to insert multiple entities.';
const multiInsertErrorMessage = 'Unable to create an array of entities. Please create entities one by one or use API version 5 or newer.';

dataStoreTypes.forEach((currentDataStoreType) => {
  describe(`CRUD Entity - ${currentDataStoreType}`, () => {
    const textFieldName = Constants.TextFieldName;
    const numberFieldName = Constants.NumberFieldName;
    const arrayFieldName = Constants.ArrayFieldName;

    let networkStore;
    let storeToTest;
    const dataStoreType = currentDataStoreType;
    const createdUserIds = [];

    const entity1 = utilities.getEntity(utilities.randomString());
    const entity2 = utilities.getEntity(utilities.randomString());
    const entity3 = utilities.getEntity(utilities.randomString());

    before(() => {
      const initProperties = {
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        masterSecret: process.env.MASTER_SECRET
      }
      return Kinvey.init(utilities.setOfflineProvider(initProperties, process.env.OFFLINE_STORAGE));
    });

    before((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => utilities.safelySignUpUser(utilities.randomString(), null, true, createdUserIds))
        .then(() => {
          // store for setup
          networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
          // store to test
          storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
          done();
        })
        .catch(done);
    });

    after((done) => {
      utilities.cleanUpAppData(collectionName, createdUserIds)
        .then(() => done())
        .catch(done);
    });
    describe('find and count operations', () => {
      before((done) => {
        networkStore.save(entity1)
          .then(() => networkStore.save(entity2))
          .then(() => {
            if (dataStoreType !== Kinvey.DataStoreType.Network) {
              return storeToTest.pull();
            }
            return Promise.resolve();
          })
          .then(() => networkStore.save(entity3))
          .then(() => done())
          .catch(done);
      });

      describe('count()', () => {
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
          storeToTest.count()
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, 2, 3);
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
          storeToTest.count(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, 1, 1);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('find()', () => {
        it('should throw an error if the query argument is not an instance of the Query class', (done) => {
          storeToTest.find({})
            .subscribe(null, (error) => {
              try {
                expect(error.message).to.equal(invalidQueryMessage);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('should return all the entities', (done) => {
          const onNextSpy = sinon.spy();
          storeToTest.find()
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, [entity1, entity2], [entity1, entity2, entity3], true);
                return utilities.retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, entity3)
                  .then((result) => {
                    if (result) {
                      result = utilities.deleteEntityMetadata(result);
                    }
                    expect(result).to.deep.equal(dataStoreType === Kinvey.DataStoreType.Cache ? entity3 : undefined);
                    done();
                  })
                  .catch(done);
              } catch (error) {
                done(error);
              }
              return Promise.resolve();
            });
        });

        it('should find the entities that match the query', (done) => {
          const onNextSpy = sinon.spy();
          const query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, [entity2], [entity2]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('findById()', () => {
        it('should throw a NotFoundError if an entity with the given id does not exist', (done) => {
          const entityId = utilities.randomString();
          const nextHandlerSpy = sinon.spy();

          storeToTest.findById(entityId).subscribe(nextHandlerSpy, (err) => {
            const expectedCallCount = dataStoreType === Kinvey.DataStoreType.Cache ? 1 : 0;
            try {
              expect(nextHandlerSpy.callCount).to.equal(expectedCallCount);
              expect(err.name).to.contain(notFoundErrorName);
            } catch (err) {
              return done(err);
            }
            return done();
          }, () => {
            done(new Error('Should not be called'));
          });
        });

        it('should return undefined if an id is not provided', (done) => {
          const spy = sinon.spy();
          storeToTest.findById().subscribe(spy, done, () => {
            try {
              expect(spy.callCount).to.equal(1);
              const result = spy.firstCall.args[0];
              expect(result).to.be.undefined;
            } catch (err) {
              return done(err);
            }
            return done();
          });
        });

        it('should return the entity that matches the id argument', (done) => {
          const onNextSpy = sinon.spy();
          storeToTest.findById(entity2._id)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, entity2, entity2);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });
    });

    // These are smoke tests and will not be executed for now.
    // If we decide to execute 'Modifiers' describe only for Sync data store, these tests will be added back
    describe('find with modifiers', () => {
      let entities = [];
      const dataCount = 10;
      before((done) => {
        for (let i = 0; i < dataCount; i += 1) {
          entities.push(utilities.getEntity());
        }

        utilities.cleanAndPopulateCollection(collectionName, entities)
          .then((result) => {
            entities = result;
            done();
          })
          .catch(done);
      });

      it('should sort ascending and skip correctly', (done) => {
        const onNextSpy = sinon.spy();
        const query = new Kinvey.Query();
        query.skip = dataCount - 2;
        query.ascending('_id');
        const expectedEntities = [entities[dataCount - 2], entities[dataCount - 1]];
        storeToTest.find(query)
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
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
        storeToTest.find(query)
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
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
        storeToTest.find(query)
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
              done();
            } catch (error) {
              done(error);
            }
          });
      });

      it('with fields should return only the specified fields', (done) => {
        const onNextSpy = sinon.spy();
        const query = new Kinvey.Query();
        query.fields = [textFieldName];
        query.equalTo(textFieldName, entities[0][textFieldName]);
        const entitySorted = entities.filter(x => x[textFieldName]===entities[0][textFieldName]);
        const expectedEntity = { _id:entitySorted[0]._id, [textFieldName]:entitySorted[0][textFieldName]};
        storeToTest.find(query)
          .subscribe(onNextSpy, done, () => {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
              done();
            } catch (error) {
              done(error);
            }
          });
      });
    });

    describe('Querying', () => {
      let entities = [];
      const dataCount = 10;
      const secondSortField = 'secondSortField';
      let onNextSpy;
      let query;

      before((done) => {
        for (let i = 0; i < dataCount; i += 1) {
          entities.push(utilities.getEntity(null, `test_${i}`, i, [`test_${i % 5}`, `second_test_${i % 5}`, `third_test_${i % 5}`]));
        }

        const textArray = ['aaa', 'aaB', 'aac'];
        for (let i = 0; i < dataCount; i += 1) {
          entities[i].secondSortField = textArray[i % 3];
        }

        // used to test exists and size operators and null values
        entities[dataCount - 1][textFieldName] = null;
        delete entities[dataCount - 1][numberFieldName];
        entities[dataCount - 1][arrayFieldName] = [];
        entities[dataCount - 2][arrayFieldName] = [{}, {}];

        utilities.cleanAndPopulateCollection(collectionName, entities)
          .then((result) => {
            entities = _.sortBy(result, numberFieldName);
            done();
          })
          .catch(done);
      });

      beforeEach((done) => {
        onNextSpy = sinon.spy();
        query = new Kinvey.Query();
        done();
      });

      describe('Comparison operators', () => {
        it('query.equalTo', (done) => {
          query.equalTo(textFieldName, entities[5][textFieldName]);
          const expectedEntities = [entities[5]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.equalTo with null', (done) => {
          query.equalTo(textFieldName, null);
          const expectedEntities = [entities[dataCount - 1]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.notEqualTo', (done) => {
          query.notEqualTo(textFieldName, entities[5][textFieldName]);
          const expectedEntities = entities.filter(entity => entity !== entities[5]);
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.notEqualTo with null', (done) => {
          query.notEqualTo(textFieldName, null);
          const expectedEntities = entities.filter(entity => entity[textFieldName] !== null);
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.greaterThan', (done) => {
          query.greaterThan(numberFieldName, entities[dataCount - 3][numberFieldName]);
          const expectedEntities = [entities[dataCount - 2]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.greaterThanOrEqualTo', (done) => {
          query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
          const expectedEntities = [entities[dataCount - 3], entities[dataCount - 2]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.lessThan', (done) => {
          query.lessThan(numberFieldName, entities[2][numberFieldName]);
          const expectedEntities = [entities[0], entities[1]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.lessThanOrEqualTo', (done) => {
          query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
          const expectedEntities = [entities[0], entities[1]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.exists', (done) => {
          query.exists(numberFieldName);
          const expectedEntities = entities.filter(entity => entity !== entities[dataCount - 1]);
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.mod', (done) => {
          query.mod(numberFieldName, 4, 2);
          const expectedEntities = entities.filter(entity => entity[numberFieldName] % 4 === 2);
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        // TODO: Add more tests for regular expression
        it('query.matches - with RegExp literal', (done) => {
          query.matches(textFieldName, /^test_5/);
          const expectedEntities = [entities[5]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('query.matches - with RegExp object', (done) => {
          query.matches(textFieldName, new RegExp('^test_5'));
          const expectedEntities = [entities[5]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });

        it('multiple operators', (done) => {
          query.lessThan(numberFieldName, entities[2][numberFieldName])
            .greaterThan(numberFieldName, entities[0][numberFieldName]);
          const expectedEntities = [entities[1]];
          storeToTest.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
      });

      describe('Array Operators', () => {
        describe('query.contains()', () => {
          it('with single value', (done) => {
            query.contains(textFieldName, entities[5][textFieldName]);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('string field with an array of values', (done) => {
            query.contains(textFieldName, entities[0][arrayFieldName]);
            const expectedEntities = [entities[0]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('array field with an array of values', (done) => {
            query.contains(arrayFieldName, entities[0][arrayFieldName]);
            const expectedEntities = [entities[0], entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('in combination with an existing filter', (done) => {
            query.notEqualTo(numberFieldName, entities[1][numberFieldName]);
            query.contains(textFieldName, [entities[0][textFieldName], entities[1][textFieldName]]);
            const expectedEntities = [entities[0]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('with null value', (done) => {
            query.contains(textFieldName, [null]);
            const expectedEntities = [entities[dataCount - 1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('query.containsAll()', () => {
          it('with single value', (done) => {
            query.containsAll(textFieldName, entities[5][textFieldName]);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('string field with an array of values', (done) => {
            query.containsAll(textFieldName, [entities[5][textFieldName]]);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('array field with an array of values', (done) => {
            const arrayFieldValue = entities[5][arrayFieldName];
            const filteredArray = arrayFieldValue.filter(entity => entity !== arrayFieldValue[2]);
            query.containsAll(arrayFieldName, filteredArray);
            const expectedEntities = [entities[0], entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('in combination with an existing filter', (done) => {
            query.notEqualTo(numberFieldName, entities[0][numberFieldName]);
            query.containsAll(arrayFieldName, entities[5][arrayFieldName]);
            const expectedEntities = [entities[5]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('query.notContainedIn()', () => {
          it('with single value', (done) => {
            query.notContainedIn(textFieldName, entities[5][textFieldName]);
            const expectedEntities = entities.filter(entity => entity !== entities[5]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('string property with an array of values', (done) => {
            query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
            const expectedEntities = entities.filter(entity => entity !== entities[0]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('array field with an array of values', (done) => {
            query.notContainedIn(arrayFieldName, entities[0][arrayFieldName]);
            const expectedEntities = entities.filter(entity => entity !== entities[0] && entity !== entities[5]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('in combination with an existing filter', (done) => {
            query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
            query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
            const expectedEntities = [entities[1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('query.size()', () => {
          it('should return the elements with an array field, having the submitted size', (done) => {
            query.size(arrayFieldName, 3);
            const expectedEntities = entities.filter(entity => entity !== entities[dataCount - 1] && entity !== entities[dataCount - 2]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should return the elements with an empty array field, if the submitted size = 0', (done) => {
            query.size(arrayFieldName, 0);
            const expectedEntities = [entities[dataCount - 1]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('in combination with an existing filter', (done) => {
            query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
            query.size(arrayFieldName, 3);
            const expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });
      });

      describe('Modifiers', () => {
        let expectedAscending;
        let expectedDescending;

        before((done) => {
          expectedAscending = _.sortBy(entities, numberFieldName);
          // moving entities with null values to the beginning of the array, as this is the sort order on the server
          expectedAscending.unshift(expectedAscending.pop());
          expectedDescending = expectedAscending.slice().reverse();
          done();
        });

        describe('Sort, Skip, Limit', () => {
          it('should sort ascending', (done) => {
            query.ascending(numberFieldName);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedAscending, expectedAscending);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should sort descending', (done) => {
            query.descending(numberFieldName);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedDescending, expectedDescending);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should sort by two fields ascending and descending', (done) => {
            query.ascending(secondSortField);
            query.descending(textFieldName);
            query.notEqualTo('_id', entities[dataCount - 1]._id);
            const sortedEntities = _.orderBy(entities, [secondSortField, textFieldName], ['asc', 'desc']);
            const expectedEntities = sortedEntities.filter(entity => entity !== entities[dataCount - 1]);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should skip correctly', (done) => {
            query.skip = dataCount - 3;
            query.descending(numberFieldName);
            const expectedEntities = expectedDescending.slice(dataCount - 3, dataCount);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should limit correctly', (done) => {
            query.limit = 2;
            query.descending(numberFieldName);
            const expectedEntities = expectedDescending.slice(0, 2);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('should skip and then limit correctly', (done) => {
            query.limit = 2;
            query.skip = 3;
            query.descending(numberFieldName);
            const expectedEntities = expectedDescending.slice(3, 5);
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });

        describe('Compound queries', () => {
          it('combine a filter with a modifier', (done) => {
            const numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.limit = 1;
            query.ascending(numberFieldName);
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue);
            const expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('two queries with a logical AND', (done) => {
            const numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue);
            const secondQuery = new Kinvey.Query();
            secondQuery.lessThanOrEqualTo(numberFieldName, numberfieldValue);
            query.and(secondQuery);
            const expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('two queries with a logical OR', (done) => {
            query.ascending(numberFieldName);
            query.equalTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
            const secondQuery = new Kinvey.Query();
            secondQuery.equalTo(numberFieldName, entities[dataCount - 2][numberFieldName]);
            query.or(secondQuery);

            const expectedEntities = [entities[dataCount - 3], entities[dataCount - 2]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('two queries with a logical NOR', (done) => {
            const numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.ascending(numberFieldName);
            query.greaterThan(numberFieldName, numberfieldValue);
            const secondQuery = new Kinvey.Query();
            secondQuery.lessThan(numberFieldName, numberfieldValue);
            // expect entities with numberFieldName not equal to entities[dataCount - 3]
            query.nor(secondQuery);

            const expectedEntities = [entities[dataCount - 1], entities[dataCount - 3]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });

          it('two queries with an inline join operator', (done) => {
            const numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue)
              .and()
              .lessThanOrEqualTo(numberFieldName, numberfieldValue);
            const expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          });
        });
      });
    });

    describe('save/create/update operations', () => {
      before((done) => {
        utilities.cleanAndPopulateCollection(collectionName, [entity1, entity2])
          .then(() => done())
          .catch(done);
      });

      beforeEach(() => {
        if (dataStoreType !== Kinvey.DataStoreType.Network) {
          return storeToTest.clearSync();
        }

        return Promise.resolve();
      });

      describe('save()', () => {
        it('should throw an error when trying to save an array of entities', (done) => {
          storeToTest.save([entity1, entity2])
            .catch((error) => {
              expect(error.message).to.equal(multiSaveErrorMessage);
              done();
            })
            .catch(done);
        });

        it('should create a new entity without _id', (done) => {
          const newEntity = {
            [textFieldName]: utilities.randomString()
          };

          storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.exist;
              expect(createdEntity[textFieldName]).to.equal(newEntity[textFieldName]);
              if (dataStoreType === Kinvey.DataStoreType.Sync) {
                expect(createdEntity._kmd.local).to.be.true;
              } else {
                utilities.assertEntityMetadata(createdEntity);
              }
              newEntity._id = createdEntity._id;
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
            })
            .then(() => done())
            .catch(done);
        });

        it('should create a new entity using its _id', (done) => {
          const id = utilities.randomString();
          const textFieldValue = utilities.randomString();
          const newEntity = utilities.getEntity(id, textFieldValue);

          storeToTest.save(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.equal(id);
              expect(createdEntity[textFieldName]).to.equal(textFieldValue);
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => done())
            .catch(done);
        });

        it('should update an existing entity', (done) => {
          const entityToUpdate = {
            _id: entity1._id,
            [textFieldName]: entity1[textFieldName],
            newProperty: utilities.randomString()
          };

          storeToTest.save(entityToUpdate)
            .then((updatedEntity) => {
              expect(updatedEntity._id).to.equal(entity1._id);
              expect(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
              return utilities.validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty');
            })
            .then(() => utilities.validatePendingSyncCount(dataStoreType, collectionName, 1))
            .then(() => done())
            .catch(done);
        });
      });

      describe('create()', () => {
        it('should create a new entity without _id', (done) => {
          const newEntity = {
            [textFieldName]: utilities.randomString()
          };

          storeToTest.create(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.exist;
              expect(createdEntity[textFieldName]).to.equal(newEntity[textFieldName]);
              if (dataStoreType === Kinvey.DataStoreType.Sync) {
                expect(createdEntity._kmd.local).to.be.true;
              } else {
                utilities.assertEntityMetadata(createdEntity);
              }
              newEntity._id = createdEntity._id;
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => {
              return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
            })
            .then(() => done())
            .catch(done);
        });

        it('should create a new entity using its _id', (done) => {
          const id = utilities.randomString();
          const textFieldValue = utilities.randomString();
          const newEntity = utilities.getEntity(id, textFieldValue);

          storeToTest.create(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.equal(id);
              expect(createdEntity[textFieldName]).to.equal(textFieldValue);
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => done())
            .catch(done);
        });

        it('should create 10 concurrent items', (done) => {
          const itemCount = 10;
          const promises = _.times(itemCount, () => {
            const entity = utilities.getEntity(utilities.randomString());
            return storeToTest.create(entity);
          });

          Promise.all(promises)
            .then((createdEntities) => {
              expect(createdEntities.length).to.equal(itemCount);
              done();
            })
            .catch(done);
        });
      });

      describe('update()', () => {
        it('should throw an error when trying to update an array of entities', (done) => {
          storeToTest.update([entity1, entity2])
            .catch((error) => {
              expect(error.message).to.equal('Unable to update an array of entities. Please update entities one by one.');
              done();
            })
            .catch(done);
        });

        it('should throw an error when trying to update without supplying an _id', (done) => {
          const expectedErrorMessage = 'The entity provided does not contain an _id';
          storeToTest.update({ test: 'test' })
            .catch((error) => {
              expect(error.message).to.contain(expectedErrorMessage);
              done();
            })
            .catch(done);
        });

        it('with a not existing _id should create a new entity using the supplied _id', (done) => {
          const id = utilities.randomString();
          const textFieldValue = utilities.randomString();
          const newEntity = utilities.getEntity(id, textFieldValue);

          storeToTest.update(newEntity)
            .then((createdEntity) => {
              expect(createdEntity._id).to.equal(id);
              expect(createdEntity[textFieldName]).to.equal(textFieldValue);
              return utilities.validateEntity(dataStoreType, collectionName, newEntity);
            })
            .then(() => done())
            .catch(done);
        });

        it('should update an existing entity', (done) => {
          const entityToUpdate = {
            _id: entity1._id,
            [textFieldName]: entity1[textFieldName],
            newProperty: utilities.randomString()
          };

          storeToTest.update(entityToUpdate)
            .then((updatedEntity) => {
              expect(updatedEntity._id).to.equal(entity1._id);
              expect(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
              return utilities.validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty');
            })
            .then(() => utilities.validatePendingSyncCount(dataStoreType, collectionName, 1))
            .then(() => done())
            .catch(done);
        });
      });
    });

    describe('destroy operations', () => {
      before((done) => {
        utilities.cleanAndPopulateCollection(collectionName, [entity1, entity2])
          .then(() => done())
          .catch(done);
      });

      describe('removeById()', () => {
        it('should throw an error if the id argument does not exist', (done) => {
          storeToTest.removeById(utilities.randomString())
            .then(() => done(new Error('Should not be called')))
            .catch((error) => {
              expect(error.name).to.contain(notFoundErrorName);
              done();
            })
            .catch(done);
        });

        it('should remove only the entity that matches the id argument', (done) => {
          const newEntity = {
            _id: utilities.randomString()
          };
          storeToTest.save(newEntity)
            .then(() => storeToTest.removeById(newEntity._id))
            .then((result) => {
              expect(result.count).to.equal(1);
              const onNextSpy = sinon.spy();
              const query = new Kinvey.Query();
              query.equalTo('_id', newEntity._id);
              return storeToTest.count(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0);
                    return storeToTest.count().toPromise()
                      .then((count) => {
                        expect(count).to.equal(2);
                        done();
                      })
                      .catch(done);
                  } catch (error) {
                    done(error);
                  }
                  return null;
                });
            })
            .catch(done);
        });
      });

      describe('remove()', () => {
        before(() => {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.clearSync();
          }
          return Promise.resolve();
        });

        it('should throw an error for an invalid query', (done) => {
          storeToTest.remove({})
            .catch((error) => {
              expect(error.message).to.equal(invalidQueryMessage);
              done();
            })
            .catch(done);
        });

        it('should remove all entities that match the query', (done) => {
          const newEntity = utilities.getEntity();
          const query = new Kinvey.Query();
          query.equalTo(textFieldName, newEntity[textFieldName]);
          let initialCount;
          utilities.saveEntities(collectionName, [newEntity, newEntity])
            .then(() => storeToTest.count().toPromise())
            .then((count) => {
              initialCount = count;
              return storeToTest.remove(query);
            })
            .then((result) => {
              expect(result.count).to.equal(2);
              const onNextSpy = sinon.spy();
              return storeToTest.count(query)
                .subscribe(onNextSpy, done, () => {
                  try {
                    utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0);
                    return storeToTest.count().toPromise()
                      .then((count) => {
                        expect(count).to.equal(initialCount - 2);
                        done();
                      })
                      .catch(done);
                  } catch (error) {
                    done(error);
                  }
                  return null;
                });
            })
            .catch(done);
        });

        it('should return a { count: 0 } when no entities are removed', (done) => {
          const query = new Kinvey.Query();
          query.equalTo('_id', utilities.randomString());
          storeToTest.remove(query)
            .then((result) => {
              expect(result.count).to.equal(0);
              done();
            })
            .catch(done);
        });
      });
    });

  describe('with API version 4', function() {
    before(function() {
      const initProperties = {
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        masterSecret: process.env.MASTER_SECRET,
        apiVersion: 4
      };
      return Kinvey.init(utilities.setOfflineProvider(initProperties, process.env.OFFLINE_STORAGE));
    });

    describe('Save', function() {
      it('should throw an error when trying to save an array of entities', (done) => {
        storeToTest.save([entity1, entity2])
          .catch((error) => {
            expect(error.message).to.equal(multiInsertErrorMessage);
            done();
          })
          .catch(done);
      });
    });

    describe('Create', function() {
      it('should throw an error when trying to create an array of entities', (done) => {
        storeToTest.create([entity1, entity2])
          .catch((error) => {
            expect(error.message).to.equal(multiInsertErrorMessage);
            done();
          })
          .catch(done);
      });
    });
  });
  });
});
