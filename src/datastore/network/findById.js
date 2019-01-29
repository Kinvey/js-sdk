import { get as getConfig } from '../../kinvey/config';
import KinveyError from '../../errors/kinvey';
import {
  formatKinveyUrl,
  KinveyRequest,
  RequestMethod,
  Auth
} from '../../http';

export default async function findById(id, options = {}) {
  if (!id) {
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
