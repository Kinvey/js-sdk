import { HttpRequest } from './request';
import { HttpResponse } from './response';
export interface HttpAdapter {
    send(request: HttpRequest): Promise<HttpResponse>;
}
export declare function setHttpAdapter(_adapter: HttpAdapter): void;
export declare function getHttpAdapter(): HttpAdapter;
export declare function send(request: HttpRequest): Promise<HttpResponse>;
