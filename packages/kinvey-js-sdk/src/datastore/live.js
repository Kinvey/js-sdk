import LiveService from '../live';
import { getConfig } from '../client';
import {
  execute,
  formatKinveyBaasUrl,
  KinveyRequest,
  RequestMethod,
  Auth,
  getSession
} from '../http';

const NAMESPACE = 'appdata';

export default class Live {
  constructor(appKey, collectionName) {
    const session = getSession();
    this.channelName = `${appKey}.c-${collectionName}`;
    this.personalChannelName = `${this.channelName}.u-${session._id}`;
  }

  async subscribe(receiver) {
    const { device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyBaasUrl(`/${NAMESPACE}/appKey/${this.collectionName}/_subscribe`),
      body: { deviceId: device.id }
    });
    await execute(request);
    LiveService.subscribeToChannel(this.channelName, receiver);
    LiveService.subscribeToChannel(this.personalChannelName, receiver);
    return this;
  }

  async unsubscribe() {
    const { device } = getConfig();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      auth: Auth.Session,
      url: formatKinveyBaasUrl(`/${NAMESPACE}/appKey/${this.collectionName}/_unsubscribe`),
      body: { deviceId: device.id }
    });
    await execute(request);
    LiveService.unsubscribeFromChannel(this.channelName);
    LiveService.unsubscribeFromChannel(this.personalChannelName);
    return this;
  }
}
