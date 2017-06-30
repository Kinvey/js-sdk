import { Promise } from 'es6-promise';
import { AsciiTree } from './asciitree';
import { RequestObject } from '../request';
import { ResponseObject } from '../request/response';

export interface MiddlewareResponse {
  request?: RequestObject;
  response?: ResponseObject;
}

export class Middleware {
  name: string;

  constructor(name = 'Middleware') {
    this.name = name;
  }

  handle(request: RequestObject, response?: ResponseObject): Promise<MiddlewareResponse> {
    return Promise.reject(new Error('A subclass middleware must override the handle function.'));
  }

  cancel(): Promise<void> {
    return Promise.resolve();
  }

  generateTree(level = 0): any {
    const root = {
      value: this.name,
      level: level,
      nodes: []
    };
    return root;
  }

  toString(): string {
    const root = this.generateTree();
    return AsciiTree.generate(root);
  }
}
