import { format } from 'url';
import urlJoin from 'url-join';
import isPlainObject from 'lodash/isPlainObject';
import { getAppKey, getInstanceId } from '../kinvey';

export function clean(value: { [key: string]: any }): { [key: string]: any } {
  return Object.keys(value).reduce((cleanVal: { [key: string]: any }, key) => {
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

export enum KinveyBaasNamespace {
  AppData = 'appdata',
  Blob = 'blob',
  Push = 'push',
  Rpc = 'rpc',
  User = 'user',
}

export function getBaasProtocol(): string {
  return 'https:';
}

export function getBaasHost(): string {
  const host = 'baas.kinvey.com';
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-${host}`;
  }

  return host;
}

export function getAuthProtocol(): string {
  return 'https:';
}

export function getAuthHost(): string {
  const host = 'auth.kinvey.com';
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-${host}`;
  }

  return host;
}

export interface KinveyUrlOptions {
  path?: string;
  query?: { [key: string]: any };
}

export interface KinveyBaasUrlOptions extends KinveyUrlOptions {
  namespace?: KinveyBaasNamespace;
}

export function formatKinveyBaasUrl(
  namespace = KinveyBaasNamespace.AppData,
  path?: string,
  query?: { [key: string]: any }
): string {
  return format({
    protocol: getBaasProtocol(),
    host: getBaasHost(),
    pathname: path ? urlJoin(namespace, getAppKey(), path) : urlJoin(namespace, getAppKey()),
    query: query ? clean(query) : undefined,
  });
}

export function formatKinveyAuthUrl(path?: string, query?: { [key: string]: any }): string {
  return format({
    protocol: getAuthProtocol(),
    host: getAuthHost(),
    pathname: path,
    query: query ? clean(query) : undefined,
  });
}
