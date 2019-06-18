"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function nested(obj, dotProperty, value) {
    if (!dotProperty) {
        return value || obj;
    }
    var parts = dotProperty.split('.');
    var currentProperty = parts.shift();
    var currentObj = obj;
    while (currentProperty && typeof currentObj !== 'undefined') {
        currentObj = currentObj[currentProperty];
        currentProperty = parts.shift();
    }
    return typeof currentObj === 'undefined' ? value : currentObj;
}
exports.nested = nested;
//# sourceMappingURL=utils.js.map