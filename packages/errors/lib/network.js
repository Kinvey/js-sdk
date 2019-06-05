"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var kinvey_1 = require("./kinvey");
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(message, debug) {
        if (message === void 0) { message = 'There was an error with the network.'; }
        var _this = _super.call(this, message, debug) || this;
        _this.name = 'NetworkError';
        return _this;
    }
    return NetworkError;
}(kinvey_1.KinveyError));
exports.NetworkError = NetworkError;
//# sourceMappingURL=network.js.map