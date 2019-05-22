import { HttpHeaders } from './headers';

export enum HttpRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
};

export interface HttpRequestConfig {
  headers?: any;
  method: HttpRequestMethod;
  url: string;
  body?: string | object;
  timeout?: number;
}

export class HttpRequest {
  public headers: HttpHeaders;
  public method: HttpRequestMethod = HttpRequestMethod.GET;
  public url: string;
  public body?: any;
  public timeout?: number;

  constructor(config?: HttpRequestConfig) {
    if (config) {
      this.headers = config.headers;

      if (config.method) {
        this.method = config.method;
      }

      this.url = config.url;
      this.body = config.body;
      this.timeout = config.timeout;
    }
  }
}
