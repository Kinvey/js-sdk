import assign = require('lodash/assign');
import forEach = require('lodash/forEach');
import isString = require('lodash/isString');
import isObject = require('lodash/isObject');
import isFunction = require('lodash/isFunction');
import cloneDeep = require('lodash/cloneDeep');

import { KinveyError } from './errors/kinvey';
import { isDefined } from './utils/object';
import { Query } from './query';

function createFunctionString(fn, ...args) {

}

export interface AggregationConfig {
  query?: Query;
  initial?: {};
  key?: {};
  reduce?: string;
}

export class Aggregation {
  key: {};
  reduce: string;
  private _initial: {};
  private _query: Query;

  constructor(config?: AggregationConfig) {
    config = assign({
      query: null,
      initial: {},
      key: {},
      reduceFn: function () {}
    }, config);

    this.query = config.query;
    this.initial = config.initial;
    this.key = config.key;
    this.reduce = config.reduce;
  }

  get initial() {
    return cloneDeep(this._initial);
  }

  set initial(initial) {
    if (isObject(initial) === false) {
      throw new KinveyError('initial must be an Object.');
    }

    this._initial = initial;
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (isDefined(query) && (query instanceof Query) === false) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    this._query = query;
  }

  by(field: string): this {
    this.key[field] = true;
    return this;
  }

  process(entities = []): any {
    const aggregation = this.toPlainObject();
    const keys = Object.keys(aggregation.key);
    const reduce = aggregation.reduce.toString().replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function('doc', 'result', reduce); // eslint-disable-line no-new-func

    if (isDefined(this.query)) {
      entities = this.query.process(entities);
    }

    if (keys.length > 0) {
      const results = [];

      keys.forEach((key) => {
        const groups = {};

        entities.forEach((entity) => {
          const keyVal = entity[key];
          let result = isDefined(groups[keyVal]) ? groups[keyVal] : cloneDeep(aggregation.initial);
          const newResult = aggregation.reduce(entity, result);

          if (isDefined(newResult)) {
            result = newResult;
          }

          groups[keyVal] = result;
        });

        Object.keys(groups).forEach((groupKey) => {
          let result = {};
          result[key] = groupKey;
          result = assign({}, result, groups[groupKey]);
          results.push(result);
        });
      });

      return results;
    }

    let result = cloneDeep(aggregation.initial);
    forEach(entities, (entity) => {
      const newResult = aggregation.reduce(entity, result);

      if (isDefined(newResult)) {
        result = newResult;
      }
    });
    return result;
  }

  toPlainObject(): any {
    return {
      key: this.key,
      initial: this.initial,
      reduce: this.reduce,
      reduceFn: this.reduce,
      condition: this.query ? this.query.toPlainObject().filter : {},
      query: this.query ? this.query.toPlainObject() : null
    };
  }

  static count(field = ''): Aggregation {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { count: 0 };
    aggregation.by(field);
    aggregation.reduce = `
      function(doc, result) {
        result.count += 1;
        return result;
      }
    `;
    return aggregation;
  }

  static sum(field = ''): Aggregation {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { sum: 0 };
    aggregation.reduce = `
      function(doc, result) {
        result.sum += doc["${field}"];
        return result;
      }
    `;

    return aggregation;
  }

  static min(field = ''): Aggregation {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { min: Infinity };
    aggregation.reduce = `
      function(doc, result) {
        result.min = Math.min(result.min, doc["${field}"]);
        return result;
      }
    `;
    return aggregation;
  }

  static max(field = ''): Aggregation {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { max: -Infinity };
    aggregation.reduce = `
      function(doc, result) {
        result.max = Math.max(result.max, doc["${field}"]);
        return result;
      }
    `
    return aggregation;
  }

  static average(field = ''): Aggregation {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { count: 0, average: 0 };
    aggregation.reduce = `
      function(doc, result) {
        result.average = (result.average * result.count + doc["${field}"]) / (result.count + 1);
        result.count += 1;
        return result;
      }
    `
    return aggregation;
  }
}
