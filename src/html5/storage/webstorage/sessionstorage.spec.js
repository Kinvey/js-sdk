import Promise from 'es6-promise';
import { expect, use } from 'chai';
import { stub } from 'sinon';
import { SessionStorageAdapter } from './sessionstorage';

const store = {};
const sessionStorage = {
  getItem(key) {
    return store[key];
  },

  setItem(key, value) {
    store[key] = value;
  },

  removeItem(key) {
    delete store[key];
  }
};

describe('SessionStorage', () => {
  let adapter;

  before(() => {
    global.sessionStorage = sessionStorage;
  });

  before(() => {
    return SessionStorageAdapter.load('test')
      .then((sessionStorageAdapter) => {
        adapter = sessionStorageAdapter;
      });
  });

  after(() => {
    delete global.sessionStorage;
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
