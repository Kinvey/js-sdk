import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

export class HttpHeaders {
  private headers: Map<string, string> = new Map();
  private normalizedNames: Map<string, string> = new Map();

  get contentType(): undefined | string {
    return this.get('Content-Type');
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  get(name: string): undefined | string {
    return this.headers.get(name.toLowerCase()) || undefined;
  }

  keys(): string[] {
    return Array.from(this.normalizedNames.values());
  }

  set(name: string, value: string): HttpHeaders
  set(name: string, value: string[]): HttpHeaders
  set(name: string, value: () => string | string[]): HttpHeaders
  set(name: string, value: any): HttpHeaders {
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

  join(headers: HttpHeaders): HttpHeaders {
    headers
      .keys()
      .forEach((name): void => {
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
    return this
      .keys()
      .reduce((headers: { [name: string]: string }, header): { [name: string]: string } => {
        const value = this.get(header);
        if (value) {
          return Object.assign(headers, { [header]: value });
        }
        return headers;
      }, {});
  }

  static fromHeaders(headers?: { [name: string]: string | string[] | (() => string | string[]) }): HttpHeaders
  static fromHeaders(headers?: HttpHeaders): HttpHeaders
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
