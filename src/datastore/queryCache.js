import isEmpty from 'lodash/isEmpty';
import Query from '../query';
import Cache from './cache';

const QUERY_CACHE_TAG = '_QueryCache';

export default class QueryCache extends Cache {
  constructor(tag) {
    super(QUERY_CACHE_TAG, tag);
  }

  // eslint-disable-next-line class-methods-use-this
  serializeQuery(query) {
    if (!query) {
      return '';
    }

    if (query.skip > 0 || query.limit < Infinity) {
      return null;
    }

    const queryObject = query.toQueryObject();
    return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
  }

  async findByKey(key) {
    const query = new Query().equalTo('query', key);
    const docs = await this.find(query);
    return docs.shift();
  }
}


// export async function clear() {
//   const { appKey } = getConfig();
//   await _clear(appKey);
//   return null;
// }
