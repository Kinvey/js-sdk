import { HttpHeaders, KinveyHttpHeaders } from './headers';
import { HttpResponse, KinveyHttpResponse } from './response';
export declare enum HttpRequestMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}
export interface HttpRequestConfig {
    headers?: {
        [name: string]: string | string[] | (() => string | string[]);
    };
    method: HttpRequestMethod;
    url: string;
    body?: string | object;
    timeout?: number;
}
export interface HttpRequestObject extends HttpRequestConfig {
    headers?: {
        [name: string]: string;
    };
}
export declare class HttpRequest {
    headers: HttpHeaders;
    method: HttpRequestMethod;
    url: string;
    body?: any;
    timeout?: number;
    constructor(config?: HttpRequestConfig);
    toPlainObject(): HttpRequestObject;
    execute(): Promise<HttpResponse>;
}
export interface KinveyHttpRequestConfig extends HttpRequestConfig {
    auth?: () => Promise<string>;
    skipBL?: boolean;
    trace?: boolean;
    properties?: any;
}
export declare class KinveyHttpRequest extends HttpRequest {
    headers: KinveyHttpHeaders;
    auth: () => Promise<string>;
    constructor(config: KinveyHttpRequestConfig);
    skipBusinessLogic(value: boolean): KinveyHttpRequest;
    trace(value: boolean): KinveyHttpRequest;
    customRequestPropertes(properties: any): KinveyHttpRequest;
    execute(refresh?: boolean): Promise<KinveyHttpResponse>;
}
