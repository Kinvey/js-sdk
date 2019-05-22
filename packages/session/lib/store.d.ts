export interface SessionStore {
    get(key: string): string | null;
    set(key: string, session: string): boolean;
    remove(key: string): boolean;
}
export declare function get(key: string): null | string;
export declare function set(key: string, session: string): boolean;
export declare function remove(key: string): boolean;
