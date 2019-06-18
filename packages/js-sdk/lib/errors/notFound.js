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
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message, debug) {
        if (message === void 0) { message = 'The doc was not found.'; }
        var _this = _super.call(this, message, debug) || this;
        _this.name = 'NotFoundError';
        return _this;
    }
    return NotFoundError;
}(kinvey_1.KinveyError));
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=notFound.js.map