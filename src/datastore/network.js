import isArray from 'lodash/isArray';
import { get as getConfig } from '../kinvey/config';
import Query from '../query';
import Aggregation from '../aggregation';
import KinveyError from '../errors/kinvey';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from '../http';
import QueryCache from './queryCache';

const NAMESPACE = 'appdata';

export default class Network {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  pathname() {
    const { appKey } = getConfig();
    return `/${NAMESPACE}/${appKey}/${this.collectionName}`;
  }

  async find(query, options = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL,
      kinveyFileTTL,
      kinveyFileTLS
    } = options;
    const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS });
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, this.pathname, queryObject),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async findWithDeltaSet(query, options = {}) {
    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL,
      kinveyFileTTL,
      kinveyFileTLS,
      since
    } = options;

    const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS, since });
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/_deltaset`, queryObject),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();


    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async findById(id, options = {}) {
    if (!id) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { appKey, apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL,
      kinveyFileTTL,
      kinveyFileTLS
    } = options;
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/${id}`, { kinveyfile_ttl: kinveyFileTTL, kinveyfile_tls: kinveyFileTLS }),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async count(query, options = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/_count`, queryObject),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data.count;
  }

  async group(aggregation, options = {}) {
    if (!(aggregation instanceof Aggregation)) {
      throw new KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/_group`),
      body: Aggregation.toPlainObject(),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data.count;
  }

  async create(doc, options = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to create an array of entities.', 'Please create entities one by one.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, this.pathname),
      body: doc,
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc, options = {}) {
    if (isArray(doc)) {
      throw new KinveyError('Unable to update an array of entities.', 'Please update entities one by one.');
    }

    if (!doc._id) {
      throw new KinveyError('The entity provided does not contain an _id. An _id is required to update the entity.', doc);
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const request = new KinveyRequest({
      method: RequestMethod.PUT,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/${doc._id}`),
      body: doc,
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async remove(query, options = {}) {
    if (query && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const queryObject = Object.assign({}, query ? query.toQueryObject() : {});
    const request = new KinveyRequest({
      method: RequestMethod.DELETE,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, this.pathname, queryObject),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id, options = {}) {
    if (!id) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const {
      rawResponse = false,
      timeout,
      properties,
      trace,
      skipBL
    } = options;
    const request = new KinveyRequest({
      method: RequestMethod.DELETE,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/${id}`),
      timeout
    });
    request.headers.customRequestProperties = properties;
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }
}
