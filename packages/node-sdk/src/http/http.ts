import { KinveyError, NetworkError } from '../errors';
import { isNetworkConnected } from '../device';

interface HttpRequest {
  headers?: { [name: string]: string };
  method: string;
  url: string;
  body?: string | object;
  timeout?: number;
}

interface HttpResponse {
  statusCode: number;
  headers: { [name: string]: string };
  data?: string;
}

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
  if (!isNetworkConnected()) {
    throw new NetworkError('The device is not connected to the network.');
  }

  return getHttpAdapter().send(request);
}
