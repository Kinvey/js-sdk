interface HttpRequest {
    headers?: {
        [name: string]: string;
    };
    method: string;
    url: string;
    body?: string | object;
    timeout?: number;
}
interface HttpResponse {
    statusCode: number;
    headers: {
        [name: string]: string;
    };
    data?: string;
}
export interface HttpAdapter {
    send(request: HttpRequest): Promise<HttpResponse>;
}
export declare function setHttpAdapter(_adapter: HttpAdapter): void;
export declare function getHttpAdapter(): HttpAdapter;
export declare function send(request: HttpRequest): Promise<HttpResponse>;
export {};
