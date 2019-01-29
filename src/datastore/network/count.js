import { get as getConfig } from '../../kinvey/config';
import Query from '../../query';
import KinveyError from '../../errors/kinvey';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from '../../http';

export default async function count(query, options = {}) {
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
