import {
  kinveySessionOrAppAuth,
  formatKinveyBaasUrl,
  KinveyBaasNamespace,
  KinveyHttpRequest,
  HttpRequestMethod
} from './http';

export interface PingOptions {
  timeout?: number;
}

export interface PingResponse {
  version: string;
  kinvey: string;
  appName: string;
  environmentName: string;
}

export async function ping(options: PingOptions = {}): Promise<PingResponse> {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.GET,
    auth: kinveySessionOrAppAuth,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.AppData),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
