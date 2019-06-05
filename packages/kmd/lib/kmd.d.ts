export interface KmdObject {
    local?: boolean;
    ect?: string;
    lmt?: string;
    authtoken?: string;
    emailVerification?: {
        status: string;
    };
}
export declare class Kmd {
    private kmd;
    constructor(kmd?: KmdObject);
    readonly createdAt: Date | undefined;
    readonly updatedAt: Date | undefined;
    readonly authtoken: string | undefined;
    isEmailConfirmed(): boolean;
    isLocal(): boolean;
}
