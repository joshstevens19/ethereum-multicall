"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    /**
     * Deep clone a object
     * @param object The object
     */
    Utils.deepClone = function (object) {
        return JSON.parse(JSON.stringify(object));
    };
    return Utils;
}());
exports.Utils = Utils;
