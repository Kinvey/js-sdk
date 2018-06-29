import Promise from 'es6-promise';
import isFunction from 'lodash/isFunction';
import { WebSQL as HTML5WebSQL } from '../../html5/storage/websql';

export class WebSQL extends HTML5WebSQL {
  constructor(name, encryptionKey) {
    super(name);
    this.encryptionKey = encryptionKey;
  }

  openTransaction(collection, query, parameters, write) {
    return new Promise((resolve, reject) => {
      try {
        const db = global.sqlitePlugin.openDatabase({ name: this.name, key: this.encryptionKey });
        super.openTransaction(collection, query, parameters, write, db)
          .then((response) => {
            if (db && isFunction(db.close)) {
              db.close(() => resolve(response), reject);
            }
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const WebSQLAdapter = {
  load(name, encryptionKey) {
    return new Promise((resolve, reject) => {
      global.sqlitePlugin.selfTest(() => resolve(new WebSQL(name, encryptionKey)), reject);
    });
  }
};
