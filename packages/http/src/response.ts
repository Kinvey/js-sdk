import isPlainObject from 'lodash/isPlainObject';
import {
  KinveyError,
  InvalidCredentialsError
} from '@kinveysdk/errors';
import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { parse } from './parse';


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
  ServerError = 500
}

export interface HttpResponseConfig {
  statusCode: HttpStatusCode;
  headers: { [name: string]: string | string[] | (() => string | string[]) };
  data?: string;
}

export interface HttpResponseObject extends HttpResponseConfig {
  headers: { [name: string]: string }
}

export class HttpResponse {
  public statusCode: HttpStatusCode;
  public headers: HttpHeaders = new HttpHeaders();
  public data?;

  constructor(config?: HttpResponseConfig) {
    if (config) {
      this.statusCode = config.statusCode;
      this.headers = new HttpHeaders(config.headers);
      this.data = parse(this.headers.contentType, config.data);
    }
  }

  isSuccess(): boolean {
    return (this.statusCode >= 200 && this.statusCode < 300)
      || this.statusCode === HttpStatusCode.MovedPermanently
      || this.statusCode === HttpStatusCode.Found
      || this.statusCode === HttpStatusCode.NotModified
      || this.statusCode === HttpStatusCode.TemporaryRedirect
      || this.statusCode === HttpStatusCode.PermanentRedirect;
  }

  toPlainObject(): HttpResponseObject {
    return Object.assign({}, {
      statusCode: this.statusCode,
      headers: this.headers.toPlainObject(),
      data: this.data
    });
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

  get error(): KinveyError | null {
    if (!this.isSuccess()) {
      if (isPlainObject(this.data)) {
        const message = this.data.message || this.data.description;
        const name = this.data.name || this.data.error;
        const { debug } = this.data;

        if (name === 'InvalidCredentials') {
          return new InvalidCredentialsError(message, debug);
        }

        return new KinveyError(message, debug);
      }

      return new KinveyError();
    }

    return null;
  }
}
