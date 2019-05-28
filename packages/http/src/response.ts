import { HttpHeaders } from './headers';
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
  headers: HttpHeaders;
  data?: string;
}

export class HttpResponse {
  public statusCode: HttpStatusCode;
  public headers: HttpHeaders;
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
}
