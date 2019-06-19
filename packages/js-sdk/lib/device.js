"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NetworkType;
(function (NetworkType) {
    NetworkType[NetworkType["None"] = 0] = "None";
    NetworkType[NetworkType["Unknown"] = 1] = "Unknown";
    NetworkType[NetworkType["Cellular"] = 2] = "Cellular";
    NetworkType[NetworkType["Wifi"] = 3] = "Wifi";
    NetworkType[NetworkType["Bluetooth"] = 4] = "Bluetooth";
    NetworkType[NetworkType["Ethernet"] = 5] = "Ethernet";
    NetworkType[NetworkType["WiMax"] = 6] = "WiMax";
    NetworkType[NetworkType["VPN"] = 7] = "VPN";
    NetworkType[NetworkType["Other"] = 8] = "Other";
})(NetworkType = exports.NetworkType || (exports.NetworkType = {}));
var state = { network: { connected: true } };
function isNetworkConnected() {
    return state.network.connected;
}
exports.isNetworkConnected = isNetworkConnected;
function setNetworkConnected(connected) {
    state.network.connected = connected === true;
}
exports.setNetworkConnected = setNetworkConnected;
function getNetworkType() {
    return state.network.type;
}
exports.getNetworkType = getNetworkType;
function setNetworkType(type) {
    state.network.type = type;
}
exports.setNetworkType = setNetworkType;
//# sourceMappingURL=device.js.map