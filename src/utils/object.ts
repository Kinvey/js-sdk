import isNull = require('lodash/isNull');
import isUndefined = require('lodash/isUndefined');

export function isDefined(obj?: any) {
  return isUndefined(obj) === false && isNull(obj) === false;
}

export function nested(obj: {}, dotProperty: string, value?: any) {
  if (isDefined(dotProperty) === false) {
    obj = value || obj;
    return obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value || obj;
}
