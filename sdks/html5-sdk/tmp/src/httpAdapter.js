Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var axios_1 = tslib_1.__importDefault(require("axios"));
var package_json_1 = require("../package.json");
// Helper function to detect the browser name and version.
function browserDetect(ua) {
    // Cast arguments.
    ua = ua.toLowerCase();
    // User-Agent patterns.
    var rChrome = /(chrome)\/([\w]+)/;
    var rFirefox = /(firefox)\/([\w.]+)/;
    var rIE = /(msie) ([\w.]+)/i;
    var rOpera = /(opera)(?:.*version)?[ /]([\w.]+)/;
    var rSafari = /(safari)\/([\w.]+)/;
    return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
        rOpera.exec(ua) || rSafari.exec(ua) || [];
}
function deviceInformation() {
    var browser = browserDetect(window.navigator.userAgent);
    var platform = browser[1];
    var browserVersion = browser[2];
    var manufacturer = window.navigator.platform;
    // Return the device information string.
    var parts = ["js-" + package_json_1.name + "/" + package_json_1.version];
    return parts.concat([platform, browserVersion, manufacturer]).map(function (part) {
        if (part) {
            return part.toString().replace(/\s/g, '_').toLowerCase();
        }
        return 'unknown';
    }).join(' ');
}
function deviceInfo() {
    return {
        hv: 1,
        os: window.navigator.appVersion,
        ov: window.navigator.appVersion,
        sdk: {
            name: package_json_1.name,
            version: package_json_1.version
        },
        pv: window.navigator.userAgent
    };
}
exports.deviceInfo = deviceInfo;
function send(request) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var url, method, headers, body, timeout, response, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = request.url, method = request.method, headers = request.headers, body = request.body, timeout = request.timeout;
                    // Add kinvey device information headers
                    if (/kinvey\.com/gm.test(url)) {
                        headers['X-Kinvey-Device-Information'] = deviceInformation();
                        headers['X-Kinvey-Device-Info'] = JSON.stringify(deviceInfo());
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default({
                            headers: headers,
                            method: method,
                            url: url,
                            data: body,
                            timeout: timeout
                        })];
                case 2:
                    response = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    if (error_1.response) {
                        response = error_1.response;
                    }
                    else {
                        throw error_1;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, {
                        statusCode: response.status,
                        headers: response.headers,
                        data: response.data
                    }];
            }
        });
    });
}
exports.send = send;
//# sourceMappingURL=httpAdapter.js.map