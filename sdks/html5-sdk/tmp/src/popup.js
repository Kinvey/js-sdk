Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var LOADED_EVENT = 'loaded';
var CLOSED_EVENT = 'closed';
var ERROR_EVENT = 'error';
var Popup = /** @class */ (function (_super) {
    tslib_1.__extends(Popup, _super);
    function Popup(popupWindow) {
        var _this = _super.call(this) || this;
        _this.popupWindow = popupWindow;
        _this.interval = window.setInterval(function () {
            if (popupWindow.closed) {
                _this.close();
            }
            else {
                try {
                    var event_1 = { url: popupWindow.location.href };
                    _this.emit(LOADED_EVENT, event_1);
                }
                catch (error) {
                    if (error.code !== window.DOMException.SECURITY_ERR) {
                        _this.emit(ERROR_EVENT, error);
                    }
                }
            }
        }, 100);
        return _this;
    }
    Popup.prototype.isClosed = function () {
        return this.popupWindow && this.popupWindow.closed === true || false;
    };
    Popup.prototype.onLoaded = function (listener) {
        return this.on(LOADED_EVENT, listener);
    };
    Popup.prototype.onClosed = function (listener) {
        return this.on(CLOSED_EVENT, listener);
    };
    Popup.prototype.onError = function (listener) {
        return this.on(ERROR_EVENT, listener);
    };
    Popup.prototype.close = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (this.interval) {
                    window.clearInterval(this.interval);
                    this.interval = null;
                }
                if (this.popupWindow && !this.popupWindow.closed) {
                    this.popupWindow.close();
                    this.popupWindow = null;
                }
                this.emit(CLOSED_EVENT);
                return [2 /*return*/];
            });
        });
    };
    Popup.open = function (url) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var popupWindow;
            return tslib_1.__generator(this, function (_a) {
                popupWindow = window.open(url, '_blank', 'toolbar=no,location=no');
                if (!popupWindow) {
                    throw new Error('The popup was blocked.');
                }
                return [2 /*return*/, new Popup(popupWindow)];
            });
        });
    };
    return Popup;
}(events_1.EventEmitter));
function open(url) {
    return Popup.open(url);
}
exports.open = open;
//# sourceMappingURL=popup.js.map