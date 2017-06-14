import expect = require('expect');
import { DataStore } from '../src/datastore';
import { randomString } from '../src/utils/string';

describe('DataStore', () => {
  describe('collection()', () => {
    expect(DataStore.collection(randomString())).toBeA(DataStore);
  })
});