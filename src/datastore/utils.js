/* eslint-disable import/prefer-default-export */
import isString from 'lodash/isString';
import Query from '../query';

export function isValidTag(tag) {
  const regexp = /^[a-z0-9-]+$/i;
  return isString(tag) && regexp.test(tag);
}

export function queryToSyncQuery(query, collectionName) {
  if (query && query instanceof Query) {
    const newFilter = Object.keys(query.filter)
      .reduce((filter, field) => Object.assign({}, filter, { [`entity.${field}`]: query.filter[field] }), {});
    const newSort = Object.keys(query.sort)
      .reduce((sort, field) => Object.assign({}, sort, { [`entity.${field}`]: query.sort[field] }), {});
    const syncQuery = new Query({
      filter: newFilter,
      sort: newSort,
      skip: query.skip,
      limit: query.limit
    });

    if (collectionName) {
      syncQuery.equalTo('collection', collectionName);
    }

    return syncQuery;
  }

  return null;
}
