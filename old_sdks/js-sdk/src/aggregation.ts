import isPlainObject from 'lodash/isPlainObject';
import { Query } from './query';

export interface AggregationConfig<T> {
  query?: Query;
  initial?: T;
  key?: any;
  reduceFn?: string;
}

export interface AggregationObject<T> {
  initial?: T;
  key?: any;
  reduceFn?: string;
  condition: { [field: string]: { [condition: string]: any } };
}

export interface AggregationAverage {
  count: number;
  average: number;
}

export interface AggregationCount {
  count: number;
}

export interface AggregationMax {
  max: number;
}

export interface AggregationMin {
  min: number;
}

export interface AggregationSum {
  sum: number;
}

export default class Aggregation<T> {
  public query?: Query;
  public initial: T;
  public key: { [field: string]: boolean } = {};
  // eslint-disable-next-line func-names, @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-empty-function
  public reduceFn: string = function() {}.toString();

  constructor(aggregation?: Aggregation<T> | AggregationConfig<T>) {
    if (aggregation instanceof Aggregation || isPlainObject(aggregation)) {
      this.query = aggregation.query;
      this.initial = aggregation.initial;
      this.key = aggregation.key;
      this.reduceFn = aggregation.reduceFn;
    }
  }

  /**
   * Adds the filed to the array of fields.
   *
   * @param {string} field
   * @returns {Aggregation} Aggregation
   */
  by(field: string): this {
    this.key[field] = true;
    return this;
  }

  process(docs: any = []): T {
    // eslint-disable-next-line no-new-func
    const reduceFn = new Function('doc', 'out', this.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, ''));
    let filteredDocs = docs;

    if (this.query instanceof Query) {
      filteredDocs = this.query.process(docs);
    }

    if (filteredDocs.length > 0) {
      const fields = Object.keys(this.key) || [];

      if (fields.length > 0) {
        return filteredDocs.reduce((results: any, doc: { [x: string]: any }): T => {
          const index = results.findIndex((result: any): boolean =>
            fields.reduce((match, field): boolean => match && result[field] === doc[field], true)
          );
          if (index === -1) {
            const result = fields.reduce(
              (_result, field): T => Object.assign({ [field]: doc[field] }, _result),
              Object.assign({}, this.initial)
            );
            results.push(reduceFn(doc, result));
            return results;
          }

          const result = results[index];
          return Object.assign({ [index]: reduceFn(doc, result) }, results);
        }, []);
      }

      return filteredDocs.reduce((result, doc): T => reduceFn(doc, result), Object.assign({}, this.initial));
    }

    return Object.assign({}, this.initial);
  }

  toPlainObject(): AggregationObject<T> {
    return {
      initial: this.initial,
      key: this.key,
      reduceFn: this.reduceFn,
      condition: this.query ? this.query.toPlainObject().filter : {},
    };
  }

  static average(field = ''): Aggregation<AggregationAverage> {
    const aggregation = new Aggregation<AggregationAverage>({
      initial: { count: 0, average: 0 },
      reduceFn:
        '' +
        'function(doc, out) {' +
        `  out.average = (out.average * out.count + doc["${field.replace("'", "\\'")}"]) / (out.count + 1);` +
        '  out.count += 1;' +
        '  return out;' +
        '}',
    });
    return aggregation;
  }

  static count(field = ''): Aggregation<AggregationCount> {
    const aggregation = new Aggregation<AggregationCount>({
      initial: { count: 0 },
      reduceFn: 'function(doc, out) { out.count += 1; return out; }',
    });
    aggregation.by(field);
    return aggregation;
  }

  static max(field = ''): Aggregation<AggregationMax> {
    const aggregation = new Aggregation<AggregationMax>({
      initial: { max: -1 * Number.MAX_SAFE_INTEGER },
      reduceFn:
        '' +
        'function(doc, out) {' +
        `  out.max = Math.max(out.max, doc["${field.replace("'", "\\'")}"]);` +
        '  return out;' +
        '}',
    });
    return aggregation;
  }

  static min(field = ''): Aggregation<AggregationMin> {
    const aggregation = new Aggregation<AggregationMin>({
      initial: { min: Number.MAX_SAFE_INTEGER },
      reduceFn:
        '' +
        'function(doc, out) {' +
        `  out.min = Math.min(out.min, doc["${field.replace("'", "\\'")}"]);` +
        '  return out;' +
        '}',
    });
    return aggregation;
  }

  static sum(field = ''): Aggregation<AggregationSum> {
    const aggregation = new Aggregation<AggregationSum>({
      initial: { sum: 0 },
      reduceFn: `function(doc, out) { out.sum += doc["${field.replace("'", "\\'")}"]; return out; }`,
    });
    return aggregation;
  }
}
