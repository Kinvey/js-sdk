import { KinveyError } from '@kinveysdk/errors';
import { HttpHeaders } from './headers';
export declare enum HttpStatusCode {
    Ok = 200,
    Created = 201,
    Empty = 204,
    MovedPermanently = 301,
    Found = 302,
    NotModified = 304,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    ServerError = 500
}
export interface HttpResponseConfig {
    statusCode: HttpStatusCode;
    headers: {
        [name: string]: string | string[] | (() => string | string[]);
    };
    data?: string;
}
export interface HttpResponseObject extends HttpResponseConfig {
    headers: {
        [name: string]: string;
    };
}
export declare class HttpResponse {
    statusCode: HttpStatusCode;
    headers: HttpHeaders;
    data?: any;
    constructor(config?: HttpResponseConfig);
    isSuccess(): boolean;
    toPlainObject(): HttpResponseObject;
}
export declare class KinveyHttpResponse extends HttpResponse {
    readonly error: KinveyError | null;
}
