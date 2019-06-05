import { Doc } from '@kinveysdk/storage';
export interface QueryObject {
    filter?: {
        [field: string]: {
            [condition: string]: any;
        };
    };
    fields?: string[];
    sort?: {
        [field: string]: number;
    };
    limit?: number;
    skip?: number;
}
export interface HttpQuery {
    query?: string;
    fields?: string;
    sort?: string;
    limit?: string;
    skip?: string;
}
export declare class Query<T extends Doc> {
    filter: {
        [field: string]: {
            [condition: string]: any;
        };
    };
    fields: string[];
    sort: {
        [field: string]: number;
    };
    limit?: number;
    skip?: number;
    private parent?;
    constructor(query?: Query<T>);
    constructor(query?: QueryObject);
    isSupportedOffline(): boolean;
    equalTo(field: string, value: any): Query<T>;
    notEqualTo(field: string, value: any): Query<T>;
    contains(field: string, values: any): Query<T>;
    notContainedIn(field: string, values: any): Query<T>;
    containsAll(field: string, values: any): Query<T>;
    greaterThan(field: string, value: any): Query<T>;
    greaterThanOrEqualTo(field: string, value: any): Query<T>;
    lessThan(field: string, value: any): Query<T>;
    lessThanOrEqualTo(field: string, value: any): Query<T>;
    exists(field: string, flag?: boolean): Query<T>;
    mod(field: string, divisor: number, remainder?: number): Query<T>;
    matches(field: string, expression: any, options?: {
        ignoreCase?: boolean;
        multiline?: boolean;
        extended?: boolean;
        dotMatchesAll?: boolean;
    }): Query<T>;
    near(field: string, coord: number[], maxDistance: number): Query<T>;
    withinBox(field: string, bottomLeftCoord: number[], upperRightCoord: number[]): Query<T>;
    withinPolygon(field: string, coords: number[][]): Query<T>;
    size(field: string, size: number): Query<T>;
    private addFilter;
    and(...args: any): Query<T>;
    nor(...args: any): Query<T>;
    or(...args: any): Query<T>;
    private join;
    ascending(field: string): Query<T>;
    descending(field: string): Query<T>;
    process(docs?: T[]): T[];
    toPlainObject(): QueryObject;
    toHttpQuery(): HttpQuery;
}
