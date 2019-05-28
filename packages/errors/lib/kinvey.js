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
var KinveyError = /** @class */ (function (_super) {
    __extends(KinveyError, _super);
    function KinveyError(message, debug) {
        var _newTarget = this.constructor;
        if (message === void 0) { message = 'An error occurred.'; }
        if (debug === void 0) { debug = ''; }
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype);
        _this.name = 'KinveyError';
        _this.debug = debug;
        return _this;
    }
    return KinveyError;
}(Error));
exports.KinveyError = KinveyError;
//# sourceMappingURL=kinvey.js.map