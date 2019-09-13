import axios from 'axios';
import { HttpRequestObject, HttpResponseObject } from '@progresskinvey/js-sdk-http';
import { name, version } from '../package.json';

function deviceInfo() {
  return {
    hv: 1,
    os: window.navigator.appVersion,
    ov: window.navigator.appVersion,
    sdk: {
      name,
      version,
    },
    pv: window.navigator.userAgent,
  };
}

export async function send(request: HttpRequestObject): Promise<HttpResponseObject> {
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
      timeout,
    });
  } catch (error) {
    if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('The network request timed out.');
    }

    if (error.code === 'ENOENT' || !error.response) {
      throw new Error();
    }

    response = error.response;
  }

  return {
    statusCode: response.status,
    headers: response.headers,
    data: response.data,
  };
}
