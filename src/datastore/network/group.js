import { get as getConfig } from '../../kinvey/config';
import KinveyError from '../../errors/kinvey';
import Aggregation from '../../aggregation';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from '../../http';

export default async function group(aggregation, options = {}) {
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
