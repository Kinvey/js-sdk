import { get as getConfig } from '../kinvey/config';
import { getId as getDeviceId } from '../kinvey/device';
import { get as getSession } from '../session';
import * as Live from '../live';
import { formatKinveyUrl } from '../http/utils';
import { KinveyRequest, RequestMethod } from '../http/request';
import { Auth } from '../http/auth';
import KinveyError from '../errors/kinvey';

import * as Network from './network';

const NAMESPACE = 'appdata';

export default class NetworkStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  /**
   * @deprecated 4.0.0 - Use collectionName instead.
   */
  get collection() {
    return this.collectionName;
  }

  get pathname() {
    const { appKey } = getConfig();
    return `/${NAMESPACE}/${appKey}/${this.collectionName}`;
  }

  get channelName() {
    const { appKey } = getConfig();
    return `${appKey}.c-${this.collectionName}`;
  }

  get personalChannelName() {
    const session = getSession();
    return `${this.channelName}.u-${session._id}`;
  }

  find(query, options) {
    return Network.find(this.pathname, query, options);
  }

  count(query, options) {
    return Network.count(this.pathname, query, options);
  }

  group(aggregation, options) {
    return Network.group(this.pathname, aggregation, options);
  }

  findById(id, options) {
    return Network.findById(this.pathname, id, options);
  }

  create(doc, options) {
    return Network.create(this.pathname, doc, options);
  }

  update(doc, options) {
    return Network.update(this.pathname, doc, options);
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  remove(query, options) {
    return Network.remove(this.pathname, query, options);
  }

  removeById(id, options) {
    return Network.removeById(this.pathname, id, options);
  }

  async subscribe(receiver) {
    if (!Live.isRegistered()) {
      throw new KinveyError('Please call Kinvey.User.registerForLiveService() before you subscribe for to the collection.');
    }

    const { apiProtocol, apiHost } = getConfig();
    const deviceId = getDeviceId();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/_subscribe`),
      body: { deviceId }
    });
    await request.execute();
    Live.subscribeToChannel(this.channelName, receiver);
    Live.subscribeToChannel(this.personalChannelName, receiver);
    return this;
  }

  async unsubscribe() {
    const { apiProtocol, apiHost } = getConfig();
    const deviceId = getDeviceId();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyUrl(apiProtocol, apiHost, `${this.pathname}/_unsubscribe`),
      body: { deviceId }
    });
    await request.execute();
    Live.unsubscribeFromChannel(this.channelName);
    Live.unsubscribeFromChannel(this.personalChannelName);
    return this;
  }
}
