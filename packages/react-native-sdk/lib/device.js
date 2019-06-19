"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var netinfo_1 = require("@react-native-community/netinfo");
var device_1 = require("kinvey-js-sdk/lib/device");
var networkStateSubscription;
function startMonitoringNetworkState() {
    if (!networkStateSubscription) {
        networkStateSubscription = netinfo_1.addEventListener(function (state) {
            device_1.setNetworkConnected(state.isConnected);
            switch (state.type) {
                case netinfo_1.NetInfoStateType.none:
                    device_1.setNetworkType(device_1.NetworkType.None);
                    break;
                case netinfo_1.NetInfoStateType.cellular:
                    device_1.setNetworkType(device_1.NetworkType.Cellular);
                    break;
                case netinfo_1.NetInfoStateType.wifi:
                    device_1.setNetworkType(device_1.NetworkType.Wifi);
                    break;
                case netinfo_1.NetInfoStateType.bluetooth:
                    device_1.setNetworkType(device_1.NetworkType.Bluetooth);
                    break;
                case netinfo_1.NetInfoStateType.ethernet:
                    device_1.setNetworkType(device_1.NetworkType.Ethernet);
                    break;
                case netinfo_1.NetInfoStateType.wimax:
                    device_1.setNetworkType(device_1.NetworkType.WiMax);
                    break;
                case netinfo_1.NetInfoStateType.vpn:
                    device_1.setNetworkType(device_1.NetworkType.VPN);
                    break;
                case netinfo_1.NetInfoStateType.unknown:
                default:
                    device_1.setNetworkType(device_1.NetworkType.Unknown);
                    break;
            }
        });
    }
}
exports.startMonitoringNetworkState = startMonitoringNetworkState;
function stopMonitoringNetworkState() {
    if (networkStateSubscription) {
        networkStateSubscription();
    }
}
exports.stopMonitoringNetworkState = stopMonitoringNetworkState;
//# sourceMappingURL=device.js.map