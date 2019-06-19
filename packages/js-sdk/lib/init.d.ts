export interface KinveySDKConfig {
    appKey: string;
    appSecret: string;
    appVersion?: string;
    instanceId?: string;
    defaultTimeout?: number;
    encryptionKey?: string;
    apiVersion?: number;
}
export declare function getAppKey(): string;
export declare function setAppKey(appKey: string): void;
export declare function getAppSecret(): string;
export declare function setAppSecret(appSecret: string): void;
export declare function getInstanceId(): string | undefined;
export declare function setInstanceId(instanceId: string): void;
export declare function getDefaultTimeout(): number;
export declare function setDefaultTimeout(timeout: number): void;
export declare function getEncryptionKey(): string | undefined;
export declare function setEncryptionKey(encryptionKey: string): void;
export declare function getApiVersion(): number;
export declare function setApiVersion(version: number): void;
export declare function init(sdkConfig: KinveySDKConfig): void;
