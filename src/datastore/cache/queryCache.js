import isEmpty from 'lodash/isEmpty';
import { KinveyHeaders } from '../../http';
import Query from '../../query';
import DataStoreCache from './datastoreCache';

const QUERY_CACHE_TAG = '_QueryCache';

export default class QueryCache extends DataStoreCache {
  constructor(tag) {
    super(QUERY_CACHE_TAG, tag);
  }

  async findByKey(key) {
    const query = new Query().equalTo('query', key);
    const docs = await this.find(query);
    return docs.shift();
  }

  async save(query, response) {
    const key = QueryCache.createKey(query);

    if (key !== null) {
      const headers = new KinveyHeaders(response.headers);
      let doc = await this.findByKey(key);

      if (!doc) {
        doc = { collectionName: this.collectionName, query: key };
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }

  static createKey(query) {
    if (!query) {
      return '';
    }

    if (query.skip > 0 || query.limit < Infinity) {
      return null;
    }

    const queryObject = query.toQueryObject();
    return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
  }
}
