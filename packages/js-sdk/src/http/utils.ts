import isPlainObject from 'lodash/isPlainObject';
import { format } from 'url';
import urlJoin from 'url-join';
import { getInstanceId, getAppKey } from '../init';

export function clean(value: { [key: string]: any }): { [key: string]: any } {
  return Object.keys(value)
    .reduce((cleanVal: { [key: string]: any }, key): { [key: string]: any } => {
      let objVal = value[key];

      if (isPlainObject(objVal)) {
        objVal = clean(objVal);
      }

      if (typeof objVal !== 'undefined' && objVal !== null) {
        return Object.assign(cleanVal, { [key]: objVal });
      }

      return cleanVal;
    }, {});
}

export function getKinveyBaasProtocol(): string {
  return 'https';
}

export function getKinveyBaasHost(): string {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-baas.kinvey.com`;
  }

  return 'baas.kinvey.com';
}

export function getKinveyAuthProtocol(): string {
  return 'https';
}

export function getKinveyAuthHost(): string {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-auth.kinvey.com`;
  }

  return 'auth.kinvey.com';
}

export enum KinveyBaasNamespace {
  AppData = 'appdata',
  Blob = 'blob',
  Push = 'push',
  Rpc = 'rpc',
  User = 'user'
}

export function formatKinveyBaasUrl(namespace: KinveyBaasNamespace, path?: string, query?: { [key: string]: any }): string {
  return format({
    protocol: getKinveyBaasProtocol(),
    host: getKinveyBaasHost(),
    pathname: path ? urlJoin(namespace, getAppKey(), path) : urlJoin(namespace, getAppKey()),
    query: query ? clean(query) : undefined
  });
}

export function formatKinveyAuthUrl(path?: string, query?: { [key: string]: any }): string {
  return format({
    protocol: getKinveyAuthProtocol(),
    host: getKinveyAuthHost(),
    pathname: path,
    query: query ? clean(query) : undefined
  });
}

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
