export declare class HttpHeaders {
    private headers;
    private normalizedNames;
    readonly contentType: undefined | string;
    has(name: string): boolean;
    get(name: string): undefined | string;
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
