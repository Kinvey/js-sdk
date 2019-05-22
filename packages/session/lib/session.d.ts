export interface SessionObject {
    _id: string;
}
export declare function getSession(): null | SessionObject;
export declare function setSession(session: SessionObject): boolean;
export declare function removeSession(): boolean;
