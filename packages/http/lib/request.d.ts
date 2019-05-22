import { HttpHeaders } from './headers';
export declare enum HttpRequestMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}
export interface HttpRequestConfig {
    headers?: any;
    method: HttpRequestMethod;
    url: string;
    body?: string | object;
    timeout?: number;
}
export declare class HttpRequest {
    headers: HttpHeaders;
    method: HttpRequestMethod;
    url: string;
    body?: any;
    timeout?: number;
    constructor(config?: HttpRequestConfig);
}
