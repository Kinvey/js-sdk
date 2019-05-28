export declare function clean(value: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export declare function getKinveyBaasProtocol(): string;
export declare function getKinveyBaasHost(): string;
export declare function getKinveyAuthProtocol(): string;
export declare function getKinveyAuthHost(): string;
export declare enum KinveyBaasNamespace {
    AppData = "appdata",
    Blob = "blob",
    Push = "push",
    Rpc = "rpc",
    User = "user"
}
export declare function formatKinveyBaasUrl(namespace: KinveyBaasNamespace, path?: string, query?: {
    [key: string]: any;
}): string;
