export declare enum NetworkType {
    None = 0,
    Unknown = 1,
    Cellular = 2,
    Wifi = 3,
    Bluetooth = 4,
    Ethernet = 5,
    WiMax = 6,
    VPN = 7,
    Other = 8
}
export interface DeviceState {
    network: {
        connected: boolean;
        type?: NetworkType;
    };
}
export declare function isNetworkConnected(): boolean;
export declare function setNetworkConnected(connected: boolean): void;
export declare function getNetworkType(): NetworkType | undefined;
export declare function setNetworkType(type: NetworkType): void;
