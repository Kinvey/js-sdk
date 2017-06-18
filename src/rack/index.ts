import { Promise } from 'es6-promise';
import reduce = require('lodash/reduce');
import isFunction = require('lodash/isFunction');
import values = require('lodash/values');

import { isDefined } from '../utils/object';
import { Middleware, MiddlewareResponse } from './middleware';
import { CacheMiddleware } from './cache';
import { HttpMiddleware } from './http';
import { ParseMiddleware } from './parse';
import { SerializeMiddleware } from './serialize';
import { RequestObject } from '../request';

export class Rack extends Middleware {
  middlewares = <Array<Middleware>>[];
  canceled = false;
  activeMiddleware?: Middleware;

  use(middleware: Middleware): this {
    if (isDefined(middleware)) {
      if (middleware instanceof Middleware) {
        this.middlewares.push(middleware);
        return;
      }

      throw new Error('Unable to use the middleware. It must be an instance of Middleware.');
    }

    return this;
  }

  reset(): this {
    this.middlewares = [];
    return this;
  }

  execute(req?: RequestObject): Promise<MiddlewareResponse> {
    if (isDefined(req) === false) {
      return Promise.reject(new Error('Request is undefined. Please provide a valid request.'));
    }

    return reduce(values(this.middlewares),
      (promise, middleware) => promise.then(({ request, response }) => {
        if (this.canceled) {
          return Promise.reject(new Error('Cancelled'));
        }

        this.activeMiddleware = middleware;
        return middleware.handle(request || req, response);
      }), Promise.resolve({ request: req, response: undefined }))
      .then(({ response }) => {
        if (this.canceled === true) {
          return Promise.reject(new Error('Cancelled'));
        }

        this.canceled = false;
        this.activeMiddleware = undefined;
        return response;
      })
      .catch((error) => {
        this.canceled = false;
        this.activeMiddleware = undefined;
        throw error;
      });
  }

  cancel(): Promise<void> {
    this.canceled = true;

    if (isDefined(this.activeMiddleware) && isFunction(this.activeMiddleware.cancel)) {
      return this.activeMiddleware.cancel();
    }

    return Promise.resolve();
  }

  handle(request) {
    return this.execute(request);
  }

  generateTree(level = 0) {
    const root = super.generateTree(level);

    values(this.middlewares).forEach((middleware) => {
      root.nodes.push(middleware.generateTree(level + 1));
    });

    return root;
  }
}

class CacheRack extends Rack {
  constructor(name = 'Cache Rack') {
    super(name);
    this.use(new CacheMiddleware());
  }

  useCacheMiddleware(cacheMiddleware: Middleware): this {
    this.reset();
    this.use(cacheMiddleware);
    return this;
  }
}
const cacheRack = new CacheRack();
export { cacheRack as CacheRack };

class NetworkRack extends Rack {
  constructor(name = 'Network Rack') {
    super(name);
    this.use(new SerializeMiddleware());
    this.use(new HttpMiddleware());
    this.use(new ParseMiddleware());
  }

  useHttpMiddleware(httpMiddleware: Middleware): this {
    this.reset();
    this.use(new SerializeMiddleware());
    this.use(httpMiddleware);
    this.use(new ParseMiddleware());
    return this;
  }
}
const networkRack = new NetworkRack();
export { networkRack as NetworkRack };
