import { request as httpRequest } from 'tns-core-modules/http';
import { device } from 'tns-core-modules/platform';
import { connectionType, getConnectionType } from 'tns-core-modules/connectivity';
import NetworkConnectionError from '../errors/networkConnection';
import pkg from '../../package.json';

function deviceInformation() {
  const platform = device.os;
  const version = device.osVersion;
  const manufacturer = device.manufacturer;
  const parts = [`js-${pkg.name}/${pkg.version}`];

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
    md: device.model,
    os: device.os,
    ov: device.osVersion,
    sdk: {
      name: pkg.name,
      version: pkg.version
    },
    pv: device.sdkVersion,
    ty: device.deviceType,
    id: device.uuid
  };
}

export default async function http(request) {
  const currentConnectionType = getConnectionType();

  if (currentConnectionType === connectionType.none) {
    throw new NetworkConnectionError();
  }

  const response = await httpRequest({
    headers: Object.assign({
      'X-Kinvey-Device-Information': deviceInformation(),
      'X-Kinvey-Device-Info': deviceInfo()
    }, request.headers),
    method: request.method,
    url: request.url,
    content: request.body,
    timeout: request.timeout
  });

  let data = response.content.raw;

  try {
    data = response.content.toString();
  } catch (e) {
    // TODO: Log error
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}
