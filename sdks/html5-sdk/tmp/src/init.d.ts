import { StorageProvider } from './storage';
export interface KinveyConfig {
    appKey: string;
    appSecret: string;
    masterSecret?: string;
    appVersion?: string;
    instanceId?: string;
    storage?: StorageProvider;
}
export declare function init(config: KinveyConfig): {
    apiHost: string;
    apiHostname: string;
    apiProtocol: string;
    appKey: string;
    appSecret: string;
    masterSecret: string;
    authHost: string;
    authHostname: string;
    authProtocol: string;
    micHost: string;
    micHostname: string;
    micProtocol: string;
    _defaultTimeout: number;
    defaultTimeout: number;
    encryptionKey: string;
    _appVersion: string;
    appVersion: string;
} & {
    storage: StorageProvider;
};
export declare function initialize(config: KinveyConfig): {
    apiHost: string;
    apiHostname: string;
    apiProtocol: string;
    appKey: string;
    appSecret: string;
    masterSecret: string;
    authHost: string;
    authHostname: string;
    authProtocol: string;
    micHost: string;
    micHostname: string;
    micProtocol: string;
    _defaultTimeout: number;
    defaultTimeout: number;
    encryptionKey: string;
    _appVersion: string;
    appVersion: string;
} & {
    storage: StorageProvider;
};
