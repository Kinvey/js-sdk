/* eslint-disable import/prefer-default-export */
import isString from 'lodash/isString';

export function isValidTag(tag) {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}
