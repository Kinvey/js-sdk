export interface SessionObject {
    _id: string;
    _kmd: {
        authtoken: string;
    };
}
export declare function getSession(): SessionObject | null;
export declare function setSession(session: SessionObject): void;
export declare function removeSession(): boolean;
