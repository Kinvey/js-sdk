import { format } from 'url';
import urlJoin from 'url-join';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import { getInstanceId, getAppKey } from '@progresskinvey/js-sdk-init';

export function byteCount(str: string): number {
  if (str) {
    let count = 0;
    const stringLength = str.length;

    for (let i = 0; i < stringLength; i += 1) {
      const partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

export function serialize(contentType: string, body?: { [name: string]: any }): string {
  if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
    const str: string[] = [];
    Object.keys(body).forEach((key) => {
      str.push(`${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`);
    });
    return str.join('&');
  }

  if (contentType.indexOf('application/json') === 0) {
    return JSON.stringify(body);
  }

  throw new Error(`Unable to serialize unknown content type ${contentType}.`);
}

export function deserialize(contentType: string, body: string): { [name: string]: any } {
  if (contentType.indexOf('application/json') !== -1) {
    return JSON.parse(body);
  }

  throw new Error(`Unable to deserialize unknown content type ${contentType}.`);
}

function clean(value: { [key: string]: any }): { [key: string]: any } {
  return Object.keys(value).reduce((cleanVal: { [key: string]: any }, key) => {
    let objVal = value[key];

    if (isPlainObject(objVal)) {
      objVal = clean(objVal);
    }

    if (typeof objVal !== 'undefined' && objVal !== null) {
      return { ...cleanVal, [key]: objVal };
    }

    return cleanVal;
  }, {});
}

export enum KinveyBaasNamespace {
  AppData = 'appdata',
  Blob = 'blob',
  Push = 'push',
  Rpc = 'rpc',
  User = 'user',
}

export function formatKinveyBaasUrl(
  namespace: KinveyBaasNamespace,
  path?: string,
  query?: { [key: string]: any }
): string {
  const instanceId = getInstanceId();
  let host = 'baas.kinvey.com';

  if (instanceId) {
    host = `${instanceId}-${host}`;
  }

  return format({
    protocol: 'https:',
    host,
    pathname: path ? urlJoin(namespace, getAppKey(), path) : urlJoin(namespace, getAppKey()),
    query: query ? clean(query) : undefined,
  });
}

export function formatKinveyAuthUrl(path?: string, query?: { [key: string]: any }): string {
  const instanceId = getInstanceId();
  let host = 'auth.kinvey.com';

  if (instanceId) {
    host = `${instanceId}-${host}`;
  }

  return format({
    protocol: 'https:',
    host,
    pathname: path,
    query: query ? clean(query) : undefined,
  });
}
