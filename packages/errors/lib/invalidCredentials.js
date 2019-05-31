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
var InvalidCredentialsError = /** @class */ (function (_super) {
    __extends(InvalidCredentialsError, _super);
    function InvalidCredentialsError(message, debug) {
        if (message === void 0) { message = 'Invalid credentials. Please retry your request with correct credentials.'; }
        var _this = _super.call(this, message, debug) || this;
        _this.name = 'InvalidCredentialsError';
        return _this;
    }
    return InvalidCredentialsError;
}(kinvey_1.KinveyError));
exports.InvalidCredentialsError = InvalidCredentialsError;
//# sourceMappingURL=invalidCredentials.js.map