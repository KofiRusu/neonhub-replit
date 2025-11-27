"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryManager = exports.RetryManager = void 0;
var promises_1 = require("timers/promises");
var logger_js_1 = require("../../lib/logger.js");
var RetryManager = /** @class */ (function () {
    function RetryManager(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c;
        this.options = options;
        this.options = {
            retries: (_a = options.retries) !== null && _a !== void 0 ? _a : 3,
            initialDelayMs: (_b = options.initialDelayMs) !== null && _b !== void 0 ? _b : 1000,
            factor: (_c = options.factor) !== null && _c !== void 0 ? _c : 2,
        };
    }
    RetryManager.prototype.run = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var attempt, _a, retries, initialDelayMs, factor, error_1, wait;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        attempt = 0;
                        _a = this.options, retries = _a.retries, initialDelayMs = _a.initialDelayMs, factor = _a.factor;
                        _b.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 7];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, fn()];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        error_1 = _b.sent();
                        attempt += 1;
                        if (attempt > (retries !== null && retries !== void 0 ? retries : 0)) {
                            throw error_1;
                        }
                        wait = (initialDelayMs !== null && initialDelayMs !== void 0 ? initialDelayMs : 1000) * Math.pow(factor !== null && factor !== void 0 ? factor : 2, attempt - 1);
                        logger_js_1.logger.warn({ attempt: attempt, wait: wait }, "Retrying connector operation after failure");
                        return [4 /*yield*/, (0, promises_1.setTimeout)(wait)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return RetryManager;
}());
exports.RetryManager = RetryManager;
exports.retryManager = new RetryManager();
