export interface SessionStore {
    get(key: string): string | null;
    set(key: string, session: string): void;
    remove(key: string): boolean;
}
export declare function getSessionStore(): SessionStore;
export declare function setSessionStore(_store: SessionStore): void;
export declare function get(key: string): null | string;
export declare function set(key: string, session: string): void;
export declare function remove(key: string): boolean;
