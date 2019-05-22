import isPlainObject from 'lodash/isPlainObject';
import { format } from 'url';
import urlJoin from 'url-join';
import { getBaasProtocol, getBaasHost, getAppKey } from '@kinveysdk/kinvey-app';

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

export enum KinveyBaasNamespace {
  AppData = 'appdata',
  Blob = 'blob',
  Push = 'push',
  Rpc = 'rpc',
  User = 'user'
}

export function formatKinveyBaasUrl(namespace: KinveyBaasNamespace, path?: string, query?: { [key: string]: any }): string {
  return format({
    protocol: getBaasProtocol(),
    host: getBaasHost(),
    pathname: path ? urlJoin(namespace, getAppKey(), path) : urlJoin(namespace, getAppKey()),
    query: query ? clean(query) : undefined
  });
}
