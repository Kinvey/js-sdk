import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import cloneDeep from 'lodash/cloneDeep';
import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { HttpResponse, HttpResponseObject, KinveyHttpResponse } from './response';
import { serialize, byteCount } from './utils';

export type HttpRequestMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export interface HttpRequestObject {
  headers: { [name: string]: string };
  method: HttpRequestMethod;
  url: string;
  body?: any;
  timeout?: number;
}

export interface HttpAdapter {
  send: (request: HttpRequestObject) => Promise<HttpResponseObject>;
}

let adapter: HttpAdapter = {
  async send() {
    throw new Error('Please override the default http adapter.');
  },
};

export function setHttpAdapter(_adapter: HttpAdapter): void {
  adapter = _adapter;
}

export function send(request: HttpRequestObject): Promise<HttpResponseObject> {
  return adapter.send(request);
}

export interface HttpRequestConfig {
  headers?: { [name: string]: string | string[] | (() => string | string[]) };
  method: HttpRequestMethod;
  url: string;
  body?: any;
  timeout?: number;
}

export class HttpRequest {
  public headers: HttpHeaders = new HttpHeaders();
  public method: HttpRequestMethod = 'GET';
  public url: string;
  public body?: any;
  public timeout?: number;

  constructor(config?: HttpRequestConfig) {
    if (config) {
      this.headers = new HttpHeaders(config.headers);

      if (config.method) {
        this.method = config.method;
      }

      this.url = config.url;
      this.body = config.body;
      this.timeout = config.timeout;
    }
  }

  async execute(): Promise<HttpResponse> {
    const response = await send(this.toPlainObject());
    return new HttpResponse({
      statusCode: response.statusCode,
      headers: response.headers,
      data: response.data,
    });
  }

  toPlainObject(): HttpRequestObject {
    const obj = {
      headers: this.headers.toPlainObject(),
      method: this.method,
      url: this.url,
      body: undefined,
      timeout: this.timeout,
    };

    if (this.body) {
      obj.body = this.body;

      if (!isString(this.body)) {
        obj.body = serialize(this.headers.contentType, this.body);
      }
    }

    return cloneDeep(obj);
  }
}

export interface KinveyHttpRequestConfig extends HttpRequestConfig {
  auth?: () => Promise<string>;
  skipBL?: boolean;
  trace?: boolean;
  properties?: any;
}

export class KinveyHttpRequest extends HttpRequest {
  public headers: KinveyHttpHeaders = new KinveyHttpHeaders();
  public auth: () => Promise<string> = async (): Promise<string> => null;

  constructor(config?: KinveyHttpRequestConfig) {
    super(config);

    if (config) {
      this.headers = new KinveyHttpHeaders(config.headers);
      this.auth = config.auth;
      this.skipBusinessLogic(config.skipBL);
      this.trace(config.trace);
      this.customRequestPropertes(config.properties);
    }
  }

  skipBusinessLogic(value: boolean): KinveyHttpRequest {
    if (value) {
      this.headers.set('X-Kinvey-Skip-Business-Logic', 'true');
    } else {
      this.headers.delete('X-Kinvey-Skip-Business-Logic');
    }
    return this;
  }

  trace(value: boolean): KinveyHttpRequest {
    if (value) {
      this.headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
      this.headers.set('X-Kinvey-ResponseWrapper', 'true');
    } else {
      this.headers.delete('X-Kinvey-Include-Headers-In-Response');
      this.headers.delete('X-Kinvey-ResponseWrapper');
    }
    return this;
  }

  customRequestPropertes(properties: any): KinveyHttpRequest {
    const customRequestPropertiesVal = JSON.stringify(properties);

    if (!isEmpty(customRequestPropertiesVal)) {
      const customRequestPropertiesByteCount = byteCount(customRequestPropertiesVal);

      if (customRequestPropertiesByteCount >= 2000) {
        throw new Error(
          `The custom properties are ${customRequestPropertiesByteCount} bytes. They must be less then 2000 bytes.`
        );
      }

      this.headers.set('X-Kinvey-Custom-Request-Properties', customRequestPropertiesVal);
    } else {
      this.headers.delete('X-Kinvey-Custom-Request-Properties');
    }

    return this;
  }

  async execute(): Promise<KinveyHttpResponse> {
    this.headers.authorization = await this.auth();
    const httpResponse = await super.execute();
    const response = new KinveyHttpResponse(httpResponse.toPlainObject());

    if (!response.isSuccess()) {
      throw response.error;
    }

    return response;
  }
}
