import { isString, isPlainObject } from 'lodash'
import { isDefined } from '../object';

export interface Header {
  name: string;
  value: string;
}

export class Headers {
  headers: {};

  constructor(headers = {}) {
    this.headers = {};
    this.addAll(headers);
  }

  get(name: string): string | undefined {
    if (name) {
      if (isString(name) === false) {
        name = String(name);
      }

      const headers = this.headers;
      return headers[name.toLowerCase()];
    }

    return undefined;
  }

  set(name: string, value: any): Headers {
    if (isDefined(name) === false || isDefined(value) === false) {
      throw new Error('A name and value must be provided to set a header.');
    }

    const headers = this.headers;
    name = name.toLowerCase();

    if (isString(value) === false) {
      headers[name] = JSON.stringify(value);
    } else {
      headers[name] = value;
    }

    this.headers = headers;
    return this;
  }

  has(name: string): boolean {
    return isDefined(this.get(name));
  }

  add(header = <Header>{}): Headers {
    return this.set(header.name, header.value);
  }

  addAll(headers = {}): Headers {
    if (headers instanceof Headers) {
      headers = headers.toPlainObject();
    }

    if (isPlainObject(headers) === false) {
      throw new Error('Headers argument must be an object.');
    }

    const names = Object.keys(headers);
    names.forEach((name) => {
      try {
        this.set(name, headers[name]);
      } catch (error) {
        // Catch the error
      }
    });
    return this;
  }

  remove(name: string): Headers {
    if (isDefined(name)) {
      if (isString(name) === false) {
        name = String(name);
      }

      const headers = this.headers;
      delete headers[name.toLowerCase()];
      this.headers = headers;
    }

    return this;
  }

  clear(): Headers {
    this.headers = {};
    return this;
  }

  toPlainObject(): {} {
    return this.headers;
  }

  toString(): string {
    return JSON.stringify(this.toPlainObject());
  }
}
