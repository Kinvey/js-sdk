import Promise from 'es6-promise';
import { expect, use } from 'chai';
import { stub } from 'sinon';
import { WebSQL, WebSQLAdapter } from './websql';
import { NotFoundError } from '../../core/errors';

use(require('chai-as-promised'));

class ResultSet {
  constructor() {
    this.rowsAffected = 0;
    this.rows = [];
  }
}

class Transaction {
  executeSql(sql, params, callback) {
    if (typeof callback === 'function') {
      callback(this, new ResultSet());
    }
  }
}

class Database {
  readTransaction(callback) {
    if (typeof callback === 'function') {
      callback(new Transaction());
    }
  }

  transaction(callback) {
    if (typeof callback === 'function') {
      callback(new Transaction());
    }
  }
}

const sqlitePlugin = {
  selfTest(successCallback) {
    if (typeof successCallback === 'function') {
      successCallback();
    }
  },

  openDatabase() {
    return new Database();
  }
};

describe('PhoneGap - WebSQL', () => {
  before(() => {
    global.sqlitePlugin = sqlitePlugin;
  });

  after(() => {
    delete global.sqlitePlugin;
  });

  describe('load()', () => {
    it('should load WebSQL without a name', () => {
      return WebSQLAdapter.load()
        .then((adapter) => {
          expect(adapter).to.be.instanceof(WebSQL);
          expect(adapter.name).to.equal('kinvey');
        });
    });

    it('should load WebSQL with a name', () => {
      const name = 'test';
      return WebSQLAdapter.load(name)
        .then((adapter) => {
          expect(adapter).to.be.instanceof(WebSQL);
          expect(adapter.name).to.equal(name);
        });
    });

    it('should load WebSQL with an encryption key', () => {
      const name = 'test';
      const encryptionKey = 'secret';
      return WebSQLAdapter.load(name, encryptionKey)
        .then((adapter) => {
          expect(adapter).to.be.instanceof(WebSQL);
          expect(adapter.name).to.equal(name);
          expect(adapter.encryptionKey).to.equal(encryptionKey);
        });
    });
  });

  describe('findById()', () => {
    it('should throw a NotFoundError for an id that does not exist', () => {
      const websql = new WebSQL('test');
      const openTransactionStub = stub(websql, 'openTransaction').callsFake(() => {
        return Promise.resolve({ result: [] });
      });
      const promise = websql.findById('iddoesnotexist');
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });
  });
});
