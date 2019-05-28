export declare class HttpHeaders {
    private headers;
    private normalizedNames;
    constructor(headers?: HttpHeaders);
    constructor(headers?: {
        [name: string]: string | string[] | (() => string | string[]);
    });
    readonly contentType: string | undefined;
    has(name: string): boolean;
    get(name: string): string | undefined;
    keys(): string[];
    set(name: string, value: string): HttpHeaders;
    set(name: string, value: string[]): HttpHeaders;
    set(name: string, value: () => string | string[]): HttpHeaders;
    join(headers: HttpHeaders): HttpHeaders;
    delete(name: string): boolean;
    toPlainObject(): {
        [name: string]: string;
    };
    static fromHeaders(headers?: {
        [name: string]: string | string[] | (() => string | string[]);
    }): HttpHeaders;
    static fromHeaders(headers?: HttpHeaders): HttpHeaders;
}
