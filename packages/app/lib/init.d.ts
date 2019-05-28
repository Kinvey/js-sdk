export interface KinveyAppConfig {
    appKey: string;
    appSecret: string;
    appVersion?: string;
    instanceId?: string;
    defaultTimeout?: number;
    encryptionKey?: string;
}
export declare function init(_config: KinveyAppConfig): void;
export declare function getAppKey(): string;
export declare function getAppSecret(): string;
export declare function getInstanceId(): string | undefined;
export declare function getDefaultTimeout(): number;
export declare function getEncryptionKey(): string | undefined;
