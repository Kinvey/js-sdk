import { HttpRequestObject, HttpResponseObject } from 'kinvey-js-sdk/lib/http';
export declare const http: {
    send(request: HttpRequestObject): Promise<HttpResponseObject>;
};
export declare function register(): void;
