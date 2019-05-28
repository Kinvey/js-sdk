import { KinveyError } from '@kinveysdk/errors';
import { HttpRequest } from './request';
import { HttpResponse } from './response';

export interface HttpAdapter {
  send(request: HttpRequest): Promise<HttpResponse>;
}

let adapter: HttpAdapter = {
  async send(): Promise<HttpResponse> {
    throw new KinveyError('You must override the default http adapter with a platform specific http adapter.');
  }
};

export function setHttpAdapter(_adapter: HttpAdapter): void {
  adapter = _adapter;
}

export function getHttpAdapter(): HttpAdapter {
  return adapter;
}

export async function send(request: HttpRequest): Promise<HttpResponse> {
  return getHttpAdapter().send(request);
}
