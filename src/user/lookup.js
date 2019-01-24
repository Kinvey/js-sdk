import Query from '../query';
import KinveyError from '../errors/kinvey';
import { get as getConfig } from '../kinvey/config';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';

const USER_NAMESPACE = 'user';

export default async function lookup(query, options = {}) {
  if (query && !(query instanceof Query)) {
    throw new KinveyError('Invalid query. It must be an instance of the Query class.');
  }

  const { apiProtocol, apiHost, appKey } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.POST,
    auth: Auth.Default,
    url: formatKinveyUrl(apiProtocol, apiHost, `/${USER_NAMESPACE}/${appKey}/_lookup`),
    body: query ? query.filter : undefined,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
