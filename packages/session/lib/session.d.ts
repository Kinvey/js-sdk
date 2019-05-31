interface MICSession {
    client_id: string;
    redirect_uri?: string;
    access_token: string;
    refresh_token?: string;
}
export interface Session {
    _id: string;
    _kmd: {
        authtoken: string;
    };
    _socialIdentity?: {
        kinveyAuth?: MICSession;
    };
}
export declare function getSession(): Session | null;
export declare function setSession(session: Session): void;
export declare function removeSession(): boolean;
export declare function getMICSession(): MICSession | null;
export declare function setMICSession(micSession: MICSession): void;
export {};
