import axios from 'axios';
import { Platform } from 'react-native';
import { NetworkError } from 'kinvey-js-sdk/lib/errors/network';
import { TimeoutError } from 'kinvey-js-sdk/lib/errors/timeout';
import { name, version } from '../package.json';

export function deviceInfo() {
  return {
    hv: 1,
    os: Platform.OS,
    ov: Platform.Version,
    pv: Platform.Version,
    sdk: {
      name,
      version
    }
  };
}

export async function send(request: any) {
  const { url, method, headers, body, timeout } = request;
  let response;

  // Add kinvey device information headers
  if (/kinvey\.com/gm.test(url)) {
    headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInfo());
  }

  try {
    response = await axios({
      headers,
      method,
      url,
      data: body,
      timeout
    });
  } catch (error) {
    if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new TimeoutError('The network request timed out.');
    }

    if (error.code === 'ENOENT' || !error.response) {
      throw new NetworkError();
    }

    response = error.response;
  }

  return {
    statusCode: response.status,
    headers: response.headers,
    data: response.data
  };
}
