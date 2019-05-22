export interface KinveyAppConfig {
    appKey: string;
    appSecret: string;
    masterSecret?: string;
    appVersion?: string;
    instanceId?: string;
    defaultTimeout?: number;
    encryptionKey?: string;
}
export declare function init(_config: KinveyAppConfig): void;
export declare function getAppKey(): string;
export declare function getAppSecret(): string;
export declare function getMasterSecret(): string;
export declare function getInstanceId(): string;
export declare function getBaasProtocol(): string;
export declare function getBaasHost(): string;
export declare function getAuthProtocol(): string;
export declare function getAuthHost(): string;
export declare function getDefaultTimeout(): number;
export declare function getEncryptionKey(): string;
