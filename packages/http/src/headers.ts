import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import { getApiVersion } from '@progresskinvey/js-sdk-init';

export class HttpHeaders {
  private headers: Map<string, string> = new Map();
  private normalizedNames: Map<string, string> = new Map();

  constructor(headers?: HttpHeaders);
  constructor(headers?: { [name: string]: string | string[] | (() => string | string[]) });
  constructor(headers?: any) {
    if (headers) {
      if (headers instanceof HttpHeaders) {
        this.join(headers);
      } else {
        Object.keys(headers).forEach((name): void => {
          this.set(name, headers[name]);
        });
      }
    }
  }

  get authorization(): string | undefined {
    return this.get('Authorization');
  }

  set authorization(value: string) {
    this.set('Authorization', value);
  }

  get contentType(): string | undefined {
    return this.get('Content-Type');
  }

  set contentType(value: string) {
    this.set('Content-Type', value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string): string | undefined {
    return this.headers.get(name.toLowerCase());
  }

  keys(): string[] {
    return Array.from(this.normalizedNames.values());
  }

  set(name: string, value: string): this;
  set(name: string, value: string[]): this;
  set(name: string, value: () => string | string[]): this;
  set(name: string, value: any): this {
    if (isFunction(value)) {
      return this.set(name, value());
    }

    if (isArray(value)) {
      return this.set(name, value.join(','));
    }

    const key = name.toLowerCase();
    this.headers.set(key, value);

    if (!this.normalizedNames.has(key)) {
      this.normalizedNames.set(key, name);
    }

    return this;
  }

  join(headers: HttpHeaders): this {
    headers.keys().forEach((name) => {
      const value = headers.get(name);
      if (value) {
        this.set(name, value);
      }
    });
    return this;
  }

  delete(name: string): boolean {
    return this.headers.delete(name);
  }

  toPlainObject(): { [name: string]: string } {
    return this.keys().reduce(
      (headers: { [name: string]: string }, header) => ({ [header]: this.get(header), ...headers }),
      {}
    );
  }

  static fromHeaders(headers?: { [name: string]: string | string[] | (() => string | string[]) }): HttpHeaders;
  static fromHeaders(headers?: HttpHeaders): HttpHeaders;
  static fromHeaders(headers?: any): HttpHeaders {
    const httpHeaders = new HttpHeaders();

    if (headers) {
      if (headers instanceof HttpHeaders) {
        httpHeaders.join(headers);
      } else {
        Object.keys(headers).forEach((name): void => {
          httpHeaders.set(name, headers[name]);
        });
      }
    }

    return httpHeaders;
  }
}

export class KinveyHttpHeaders extends HttpHeaders {
  constructor(headers?: KinveyHttpHeaders);
  constructor(headers?: { [name: string]: string | string[] | (() => string | string[]) });
  constructor(headers?: any) {
    super(headers);

    // Add the Accept header
    if (!this.has('Accept')) {
      this.set('Accept', 'application/json; charset=utf-8');
    }

    // Add Content-Type header
    if (!this.has('Content-Type')) {
      this.set('Content-Type', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!this.has('X-Kinvey-Api-Version')) {
      this.set('X-Kinvey-Api-Version', String(getApiVersion()));
    }
  }

  get requestStart(): string | undefined {
    return this.get('X-Kinvey-Request-Start');
  }
}
