import { Promise } from 'es6-promise';
import qs = require('qs');
import assign = require('lodash/assign');
import isString = require('lodash/isString');
import isNumber = require('lodash/isNumber');

import { Response } from './response';
import { Headers } from './headers';
import { Rack } from '../rack';
import { Client } from '../client';
import { isDefined } from '../utils/object';
import { Properties } from './properties';
import { KinveyError } from '../errors/kinvey';
import { NoResponseError } from '../errors/noResponse';

/**
 * @private
 * Enum for Request Methods.
 */
export enum RequestMethod {
  GET,
  POST,
  PATCH,
  PUT,
  DELETE
}

export interface RequestOptions {
  method?: RequestMethod;
  headers?: Headers;
  url?: string;
  body?: any;
  data?: any;
  properties?: Properties;
  timeout?: number;
  followRedirect?: boolean;
}

export interface RequestObject {
  method: string;
  headers: {};
  url: string;
  body?: any;
  timeout: number;
  followRedirect: boolean;
}

export class Request {
  method: RequestMethod;
  url: string;
  body?: any;
  protected rack?: Rack;
  protected _headers: Headers;
  protected _url: string;
  protected _timeout: number;
  protected _followRedirect = true;

  constructor(options: RequestOptions) {
    options = assign({
      followRedirect: true
    }, options);

    this.method = options.method || RequestMethod.GET;
    this.headers = options.headers || new Headers();
    this.url = options.url || '';
    this.body = options.body || options.data;
    this.followRedirect = options.followRedirect === true;
  }

  get headers() {
    return this._headers;
  }

  set headers(headers) {
    if ((headers instanceof Headers) === false) {
      headers = new Headers(headers);
    }

    this._headers = headers;
  }

  get data() {
    return this.body;
  }

  set data(data) {
    this.body = data;
  }

  get timeout() {
    return this._timeout;
  }

  set timeout(timeout) {
    if (isNumber(timeout) === false || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    this._timeout = timeout;
  }

  get followRedirect() {
    return this._followRedirect;
  }

  set followRedirect(followRedirect) {
    this._followRedirect = !!followRedirect;
  }

  execute() {
    if (isDefined(this.rack) === false) {
      return Promise.reject(
        new KinveyError('Unable to execute the request. Please provide a rack to execute the request.')
      );
    }

    return this.rack.execute(this.toPlainObject())
      .then((response) => {
        if (isDefined(response) === false) {
          throw new NoResponseError();
        }

        if ((response instanceof Response) === false) {
          response = new Response({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        return response;
      });
  }

  cancel() {
    return this.rack.cancel();
  }

  toPlainObject(): RequestObject {
    let method = 'GET';

    switch(this.method) {
      case RequestMethod.POST:
        method = 'POST';
        break;
      case RequestMethod.PUT:
        method = 'PUT';
        break;
      case RequestMethod.PATCH:
        method = 'PATCH';
        break;
      case RequestMethod.DELETE:
        method = 'DELETE';
        break;
      default:
        method = 'GET';
    }

    return {
      method: method,
      headers: this.headers.toPlainObject(),
      url: this.url,
      body: this.body,
      timeout: this.timeout,
      followRedirect: this.followRedirect
    };
  }
}
