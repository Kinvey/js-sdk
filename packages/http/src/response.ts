import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { deserialize } from './utils';

export enum HttpStatusCode {
  Ok = 200,
  Created = 201,
  Empty = 204,
  MovedPermanently = 301,
  Found = 302,
  NotModified = 304,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  ServerError = 500,
}

export interface HttpResponseObject {
  statusCode: number;
  headers: { [name: string]: string };
  data?: any;
}

export interface HttpResponseConfig {
  statusCode: number;
  headers: { [name: string]: string | string[] | (() => string | string[]) };
  data?: any;
}

export class HttpResponse {
  public statusCode: HttpStatusCode;
  public headers: HttpHeaders = new HttpHeaders();
  public data?;

  constructor(config?: HttpResponseConfig) {
    if (config) {
      this.statusCode = config.statusCode;
      this.headers = new HttpHeaders(config.headers);

      if (isString(config.data)) {
        this.data = deserialize(this.headers.contentType, config.data);
      } else {
        this.data = config.data;
      }
    }
  }

  isSuccess(): boolean {
    return (
      (this.statusCode >= 200 && this.statusCode < 300) ||
      this.statusCode === HttpStatusCode.MovedPermanently ||
      this.statusCode === HttpStatusCode.Found ||
      this.statusCode === HttpStatusCode.NotModified ||
      this.statusCode === HttpStatusCode.TemporaryRedirect ||
      this.statusCode === HttpStatusCode.PermanentRedirect
    );
  }

  toPlainObject(): HttpResponseObject {
    return {
      statusCode: this.statusCode,
      headers: this.headers.toPlainObject(),
      data: this.data,
    };
  }
}

export class KinveyHttpResponse extends HttpResponse {
  public headers: KinveyHttpHeaders = new KinveyHttpHeaders();

  constructor(config?: HttpResponseConfig) {
    super(config);

    if (config) {
      this.headers = new KinveyHttpHeaders(config.headers);
    }
  }

  get error(): Error | null {
    if (!this.isSuccess()) {
      if (isPlainObject(this.data)) {
        const message = this.data.message || this.data.description;
        // const name = this.data.name || this.data.error;
        // const { debug } = this.data;
        return new Error(message);
      }
    }

    return null;
  }
}
