import isFunction from 'lodash/isFunction';
import PubNub from 'pubnub';
import { EventEmitter } from 'events';

const STATUS_PREFIX = 'status:';
const UNCLASSIFIED_EVENTS = 'pubNubEventsNotRouted';

function isValidChannelName(channelName) {
  return (typeof channelName === 'string') && channelName !== '';
}

function isValidReceiver(receiver) {
  if (!receiver) {
    return false;
  }
  const { onMessage, onError, onStatus } = receiver;
  return isFunction(onMessage) || isFunction(onError) || isFunction(onStatus);
}

class Listener extends EventEmitter {
  message(m) {
    this.emit(m.channel, m.message);
  }

  status(s) {
    const { affectedChannels = [], affectedChannelGroups = [] } = s;
    const allEvents = affectedChannels.concat(affectedChannelGroups);

    if (allEvents.length > 0) {
      allEvents.forEach((channelOrGroup) => {
        this.emit(`${STATUS_PREFIX}${channelOrGroup}`, s);
      });
    } else {
      this.emit(UNCLASSIFIED_EVENTS, s);
    }
  }
}

class LiveService {
  isRegistered() {
    return !!this.pubnub && !!this.listener;
  }

  register(config) {
    if (!this.isRegistered()) {
      this.pubnub = new PubNub(config);
      this.listener = new Listener();
      this.pubnub.addListener(this.listener);
    }
    return this;
  }

  unregister() {
    if (this.isRegistered()) {
      this.pubnub.unsubscribeAll();
      this.pubnub = null;
      this.listener.removeAllListeners();
      this.listener = null;
    }
  }

  subscribeToChannel(channelName, receiver = {}) {
    const { onMessage, onError, onStatus } = receiver;

    if (!isValidChannelName(channelName)) {
      throw new Error('Invalid channel name.');
    }

    if (!isValidReceiver(receiver)) {
      throw new Error('Invalid receiver.');
    }

    if (!this.isRegistered()) {
      throw new Error('Please register to the Live Service before you subscribe to the channel.');
    }

    if (isFunction(onMessage)) {
      this.listener.on(channelName, onMessage);
    }

    if (isFunction(onError)) {
      this.listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
        if (status.error) {
          onError(status);
        }
      });
    }

    if (isFunction(onStatus)) {
      this.listener.on(`${STATUS_PREFIX}${channelName}`, (status) => {
        if (!status.error) {
          onStatus(status);
        }
      });
    }
  }

  unsubscribeFromChannel(channelName) {
    this.listener.removeAllListeners(channelName);
    this.listener.removeAllListeners(`${STATUS_PREFIX}${channelName}`);
  }
}

export default new LiveService();
