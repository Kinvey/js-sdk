"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var init_1 = require("kinvey-js-sdk/lib/init");
var http_1 = require("./http");
var device_1 = require("./device");
function init(config) {
    http_1.register();
    device_1.startMonitoringNetworkState();
    init_1.init(config);
}
exports.init = init;
//# sourceMappingURL=init.js.map