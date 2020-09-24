import { Http, Device } from '@nativescript/core';
import { name, version } from '../../package.json';

function deviceInformation() {
  const platform = Device.os;
  const version = Device.osVersion;
  const manufacturer = Device.manufacturer;
  const parts = [`js-${name}/${version}`];

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInfo() {
  return {
    hv: 1,
    md: Device.model,
    os: Device.os,
    ov: Device.osVersion,
    sdk: {
      name,
      version
    },
    pv: Device.sdkVersion,
    ty: Device.deviceType,
    id: Device.uuid
  };
}

export async function send(request: any): Promise<any> {
  const { url, method, headers, body, timeout } = request;
  const kinveyUrlRegex = /kinvey\.com/gm;

  // Add kinvey device information headers
  if (kinveyUrlRegex.test(url)) {
    headers['X-Kinvey-Device-Information'] = deviceInformation();
    headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInfo());
  }

  const response = await Http.request({
    headers,
    method,
    url,
    content: body,
    timeout
  });

  let data;
  if (response.content) {
    try {
      data = response.content.toString();
    } catch (e) {
      // TODO: log error
      data = response.content.raw;
    }
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}
