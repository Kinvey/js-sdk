import url = require('url');
import qs = require('qs');
import assign = require('lodash/assign');
import isArray = require('lodash/isArray');
import isPlainObject = require('lodash/isPlainObject');
import isString = require('lodash/isString');
import isEmpty = require('lodash/isEmpty');
import { isDefined } from './object';

export interface SerializeOptions {
  removeNull: boolean;
  encodeComponent: boolean;
  encodeComponents: boolean;
}

function serialize(obj: any, options?: SerializeOptions, prefix?: string) {
  const str = [];
  let useArraySyntax = false;

  if (isArray(obj) && isDefined(prefix)) {
    useArraySyntax = true;
  }

  Object.keys(obj).forEach((prop) => {
    let query;
    const val = obj[prop];

    const key = prefix ?
      `${prefix}[${useArraySyntax ? '' : prop}]` :
      prop;

    if (isDefined(val) === false) {
      if (options.removeNull === true) {
        return;
      }

      query = options.encodeComponents === true ? encodeURIComponent(key) : key;
    } else if (isPlainObject(val)) {
      query = serialize(val, options, key);
    } else {
      query = options.encodeComponent === true ?
        `${encodeURIComponent(key)}=${encodeURIComponent(val)}` :
        `${key}=${val}`;
    }

    str.push(query);
  });

  return str.join('&');
}

export function appendQuery(uri, query, options?: SerializeOptions) {
  const parts = url.parse(uri, true);
  const queryToAppend = isString(query) ? qs.parse(query) : query;
  const parsedQuery = assign({}, parts.query, queryToAppend);
  options = assign({ encodeComponents: true, removeNull: true }, options);
  parts.query = null;
  const queryString = serialize(parsedQuery, options);
  parts.search = isDefined(queryString) && isEmpty(queryString) === false ? `?${queryString}` : null;
  return url.format(parts);
}
