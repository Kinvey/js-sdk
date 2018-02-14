import Promise from 'es6-promise';
import { expect, use } from 'chai';
import { stub } from 'sinon';
import { LocalStorageAdapter } from './localstorage';

const localStorageStore = {};
const localStorage = {
  getItem(key) {
    return localStorageStore[key];
  },

  setItem(key, value) {
    localStorageStore[key] = value;
  },

  removeItem(key) {
    delete localStorageStore[key];
  }
};

describe('LocalStorage', () => {
  let adapter;

  before(() => {
    global.localStorage = localStorage;
  });

  before(() => {
    return LocalStorageAdapter.load('test')
      .then((localStorageAdapter) => {
        adapter = localStorageAdapter;
      });
  });

  after(() => {
    delete global.localStorage;
  });

  afterEach(() => adapter.clear());

  describe('find()', () => {
    let docs = [];

    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        docs.push({ _id: i });
      }

      return adapter.save('docs', docs);
    });

    it('should return all the docs', () => {
      return adapter.find('docs')
        .then((savedDocs) => {
          expect(savedDocs).to.deep.equal(docs);
        });
    });
  });

  describe('save()', () => {
    it('should save the doc', () => {
      const doc = { _id: 0 };

      return adapter.save('docs', doc)
        .then((savedDoc) => {
          expect(savedDoc).to.deep.equal(doc);
        });
    });

    it('should save the docs', () => {
      const docs = [];

      for (let i = 0; i < 10; i++) {
        docs.push({ _id: i });
      }

      return adapter.save('docs', docs)
        .then((savedDocs) => {
          expect(savedDocs).to.deep.equal(docs);
        });
    });
  });
});
