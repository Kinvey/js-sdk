/* eslint no-useless-constructor: "off" */

import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import sift from 'sift';
import { KinveyError } from '../errors';
import { Doc } from '../storage';
import { nested } from './utils';

const UNSUPPORTED_CONDITIONS = ['$nearSphere'];
const PROTECTED_FIELDS = ['_id', '_acl'];

export interface QueryObject {
  filter?: { [field: string]: { [condition: string]: any } };
  fields?: string[];
  sort?: { [field: string]: number };
  limit?: number;
  skip?: number;
}

export interface HttpQueryObject {
  query?: string;
  fields?: string;
  sort?: string;
  limit?: string;
  skip?: string;
}

export class Query<T extends Doc> {
  public filter: { [field: string]: { [condition: string]: any } } = {};
  public fields: string[] = [];
  public sort: { [field: string]: number } = {};
  public limit?: number;
  public skip?: number;
  private parent?: Query<T>;

  constructor(query?: Query<T>);
  constructor(query?: QueryObject);
  constructor(query?: any) {
    if (query instanceof Query || isPlainObject(query)) {
      this.fields = query.fields;
      this.filter = query.filter;
      this.sort = query.sort;
      this.limit = query.limit;
      this.skip = query.skip;
    }
  }

  get _id(): string {
    if ((isNumber(this.skip) && this.skip > 0) || (isNumber(this.limit) && this.limit < Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    const toPlainObject = this.toPlainObject();
    return toPlainObject && !isEmpty(toPlainObject) ? JSON.stringify(toPlainObject) : '';
  }

  isSupportedOffline(): boolean {
    return Object.keys(this.filter).reduce((supported, key): boolean => {
      if (supported) {
        const value = this.filter[key];
        return UNSUPPORTED_CONDITIONS.some((unsupportedConditions): boolean => {
          if (!value) {
            return true;
          }

          if (!isObject(value)) {
            return true;
          }

          return !Object.keys(value).some((condition): boolean => condition === unsupportedConditions);
        });
      }

      return supported;
    }, true);
  }

  equalTo(field: string, value: any): Query<T> {
    return this.addFilter(field, '$eq', value);
  }

  notEqualTo(field: string, value: any): Query<T> {
    return this.addFilter(field, '$ne', value);
  }

  contains(field: string, values: any): Query<T> {
    if (!values) {
      throw new KinveyError('You must supply a value.');
    }

    if (!isArray(values)) {
      return this.addFilter(field, '$in', [values]);
    }

    return this.addFilter(field, '$in', values);
  }

  notContainedIn(field: string, values: any): Query<T> {
    if (!values) {
      throw new KinveyError('You must supply a value.');
    }

    if (!isArray(values)) {
      return this.addFilter(field, '$nin', [values]);
    }

    return this.addFilter(field, '$nin', values);
  }

  containsAll(field: string, values: any): Query<T> {
    if (!values) {
      throw new KinveyError('You must supply a value.');
    }

    if (!isArray(values)) {
      return this.addFilter(field, '$all', [values]);
    }

    return this.addFilter(field, '$all', values);
  }

  greaterThan(field: string, value: any): Query<T> {
    if (!isNumber(value) && !isString(value)) {
      throw new KinveyError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gt', value);
  }

  greaterThanOrEqualTo(field: string, value: any): Query<T> {
    if (!isNumber(value) && !isString(value)) {
      throw new KinveyError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gte', value);
  }

  lessThan(field: string, value: any): Query<T> {
    if (!isNumber(value) && !isString(value)) {
      throw new KinveyError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lt', value);
  }

  lessThanOrEqualTo(field: string, value: any): Query<T> {
    if (!isNumber(value) && !isString(value)) {
      throw new KinveyError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lte', value);
  }

  exists(field: string, flag = true): Query<T> {
    return this.addFilter(field, '$exists', flag === true);
  }

  mod(field: string, divisor: number, remainder = 0): Query<T> {
    if (!isNumber(divisor)) {
      throw new KinveyError('divisor must be a number');
    }

    if (!isNumber(remainder)) {
      throw new KinveyError('remainder must be a number');
    }

    return this.addFilter(field, '$mod', [divisor, remainder]);
  }

  matches(
    field: string,
    expression: any,
    options: { ignoreCase?: boolean; multiline?: boolean; extended?: boolean; dotMatchesAll?: boolean } = {}
  ): Query<T> {
    const flags = [];
    let regExp = expression;

    if (!(regExp instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.source.indexOf('^') !== 0) {
      throw new KinveyError(
        "regExp must have '^' at the beginning of the expression to make it an anchored expression."
      );
    }

    if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
      throw new KinveyError('ignoreCase flag is not supported');
    }

    if ((regExp.multiline || options.multiline) && options.multiline !== false) {
      flags.push('m');
    }

    if (options.extended === true) {
      flags.push('x');
    }

    if (options.dotMatchesAll === true) {
      flags.push('s');
    }

    if (flags.length > 0) {
      this.addFilter(field, '$options', flags.join(''));
    }

    return this.addFilter(field, '$regex', regExp.source);
  }

  near(field: string, coord: number[], maxDistance: number): Query<T> {
    if (!Array.isArray(coord) || !isNumber(coord[0]) || !isNumber(coord[1])) {
      throw new KinveyError('coord must be a [number, number]');
    }

    this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

    if (isNumber(maxDistance)) {
      this.addFilter(field, '$maxDistance', maxDistance);
    }

    return this;
  }

  withinBox(field: string, bottomLeftCoord: number[], upperRightCoord: number[]): Query<T> {
    if (!Array.isArray(bottomLeftCoord) || !isNumber(bottomLeftCoord[0]) || !isNumber(bottomLeftCoord[1])) {
      throw new KinveyError('bottomLeftCoord must be a [number, number]');
    }

    if (!Array.isArray(upperRightCoord) || !isNumber(upperRightCoord[0]) || !isNumber(upperRightCoord[1])) {
      throw new KinveyError('upperRightCoord must be a [number, number]');
    }

    const coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
    return this.addFilter(field, '$within', { $box: coords });
  }

  withinPolygon(field: string, coords: number[][]): Query<T> {
    if (Array.isArray(coords) === false || coords.length === 0 || coords[0].length > 3) {
      throw new KinveyError('coords must be a [[number, number]]');
    }

    const withinCoords = coords.map((coord): number[] => {
      if (!isNumber(coord[0]) || !isNumber(coord[1])) {
        throw new KinveyError('coords argument must be a [number, number]');
      }

      return [coord[0], coord[1]];
    });

    return this.addFilter(field, '$within', { $polygon: withinCoords });
  }

  size(field: string, size: number): Query<T> {
    if (!isNumber(size)) {
      throw new KinveyError('size must be a number');
    }

    return this.addFilter(field, '$size', size);
  }

  private addFilter(field: string, condition: string, value: any): Query<T> {
    this.filter[field] = Object.assign({}, this.filter[field], { [condition]: value });
    return this;
  }

  and(...args: any): Query<T> {
    // AND has highest precedence. Therefore, even if this query is part of a
    // JOIN already, apply it on this query.
    return this.join('$and', args);
  }

  nor(...args: any): Query<T> {
    // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
    // apply the NOR onto the parent to make sure AND indeed precedes NOR.
    if (this.parent && Object.hasOwnProperty.call(this.parent.filter, '$and')) {
      return this.parent.nor.apply(this.parent, ...args);
    }

    return this.join('$nor', args);
  }

  or(...args: any): Query<T> {
    // OR has lowest precedence. Therefore, if this query is part of any join,
    // apply the OR onto the parent to make sure OR has indeed the lowest
    // precedence.
    if (this.parent) {
      return this.parent.or.apply(this.parent, ...args);
    }

    return this.join('$or', args);
  }

  private join(operator: string, queries: any): Query<T> {
    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    let result = new Query<T>(this);
    let filters = queries.map((queryObject): [] => {
      let query = queryObject;
      if (!(queryObject instanceof Query)) {
        if (isPlainObject(queryObject)) {
          query = new Query<T>(queryObject);
        } else {
          throw new KinveyError('query argument must be of type: Kinvey.Query[] or Object[].');
        }
      }
      return query.toPlainObject().filter;
    });

    // If there are no `queries` supplied, create a new (empty) `Kinvey.Query`.
    // This query is the right-hand side of the join expression, and will be
    // returned to allow for a fluent interface.
    if (filters.length === 0) {
      result = new Query<T>();
      filters = [result.toPlainObject().filter];
      result.parent = new Query<T>(this);
    }

    // Join operators operate on the top-level of `_filter`. Since the `toJSON`
    // magic requires `_filter` to be passed by reference, we cannot simply re-
    // assign `_filter`. Instead, empty it without losing the reference.
    const currentFilter = Object.keys(this.filter).reduce((filter, key): {
      [field: string]: { [condition: string]: any };
    } => {
      const newFilter = Object.assign(filter, { [key]: this.filter[key] });
      delete this.filter[key];
      return newFilter;
    }, {});

    // `currentFilter` is the left-hand side query. Join with `filters`.
    this.filter[operator] = [currentFilter].concat(filters);
    return result;
  }

  ascending(field: string): Query<T> {
    if (this.parent) {
      this.parent.ascending(field);
    } else {
      this.sort[field] = 1;
    }
    return this;
  }

  descending(field: string): Query<T> {
    if (this.parent) {
      this.parent.descending(field);
    } else {
      this.sort[field] = -1;
    }
    return this;
  }

  process(docs: T[] = []): T[] {
    const queryObject = this.toPlainObject();

    if (!Array.isArray(docs)) {
      throw new Error('data argument must be of type: Array.');
    }

    if (!this.isSupportedOffline()) {
      throw new Error('This query is not able to run locally.');
    }

    if (docs.length > 0) {
      let processedDocs;
      const { filter } = queryObject;

      if (filter && !isEmpty(filter)) {
        processedDocs = docs.filter(sift(filter));
      } else {
        processedDocs = docs;
      }

      if (!isEmpty(queryObject.sort)) {
        // eslint-disable-next-line arrow-body-style
        processedDocs.sort((a, b): T[] => {
          return Object.keys(queryObject.sort).reduce((result: any, field): number => {
            if (typeof result !== 'undefined' && result !== 0) {
              return result;
            }

            if (Object.prototype.hasOwnProperty.call(queryObject.sort, field)) {
              const aField = nested(a, field);
              const bField = nested(b, field);
              const modifier = queryObject.sort[field]; // -1 (descending) or 1 (ascending)

              if (
                aField !== null &&
                typeof aField !== 'undefined' &&
                (bField === null || typeof bField === 'undefined')
              ) {
                return 1 * modifier;
              }
              if (
                bField !== null &&
                typeof bField !== 'undefined' &&
                (aField === null || typeof aField === 'undefined')
              ) {
                return -1 * modifier;
              }
              if (typeof aField === 'undefined' && bField === null) {
                return 0;
              }
              if (aField === null && typeof bField === 'undefined') {
                return 0;
              }
              if (aField !== bField) {
                return (aField < bField ? -1 : 1) * modifier;
              }
            }

            return 0;
          }, undefined);
        });
      }

      if (isNumber(queryObject.skip) && queryObject.skip > 0) {
        if (isNumber(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
          processedDocs = processedDocs.slice(queryObject.skip, queryObject.skip + queryObject.limit);
        } else {
          processedDocs = processedDocs.slice(queryObject.skip);
        }
      } else if (isNumber(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
        processedDocs = processedDocs.slice(0, queryObject.limit);
      }

      if (isArray(queryObject.fields) && queryObject.fields.length > 0) {
        processedDocs = processedDocs.map((doc): T[] => {
          const modifiedDoc: any = doc;
          Object.keys(modifiedDoc).forEach((key): void => {
            if (queryObject.fields && queryObject.fields.indexOf(key) === -1 && PROTECTED_FIELDS.indexOf(key) === -1) {
              delete modifiedDoc[key];
            }
          });
          return modifiedDoc;
        });
      }

      return processedDocs;
    }

    return docs;
  }

  toPlainObject(): QueryObject {
    if (this.parent) {
      return this.parent.toPlainObject();
    }
    return cloneDeep({
      fields: this.fields,
      filter: this.filter,
      sort: this.sort,
      skip: this.skip,
      limit: this.limit
    });
  }

  toHttpQueryObject(): HttpQueryObject {
    const queryObject = this.toPlainObject();
    const httpQueryObject: any = {};

    if (Object.keys(queryObject.filter).length > 0) {
      httpQueryObject.query = queryObject.filter;
    }

    if (queryObject.fields && queryObject.fields.length > 0) {
      httpQueryObject.fields = queryObject.fields.join(',');
    }

    if (isNumber(queryObject.limit) && queryObject.limit < Number.MAX_SAFE_INTEGER) {
      httpQueryObject.limit = queryObject.limit;
    }

    if (isNumber(queryObject.skip) && queryObject.skip > 0) {
      httpQueryObject.skip = queryObject.skip;
    }

    if (queryObject.sort && Object.keys(queryObject.sort).length > 0) {
      httpQueryObject.sort = queryObject.sort;
    }

    Object.keys(httpQueryObject).forEach((key): any => {
      httpQueryObject[key] = isString(httpQueryObject[key])
        ? httpQueryObject[key]
        : JSON.stringify(httpQueryObject[key]);
    });

    return httpQueryObject;
  }
}
