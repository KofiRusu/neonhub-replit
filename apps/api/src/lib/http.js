"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.ok = void 0;
var ok = function (data, sources) { return (__assign({ ok: true, data: data }, (sources ? { sources: sources } : {}))); };
exports.ok = ok;
var fail = function (error, code) {
    if (code === void 0) { code = 500; }
    return ({
        code: code,
        body: { ok: false, error: error },
    });
};
exports.fail = fail;
