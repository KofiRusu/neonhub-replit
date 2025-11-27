"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.TrelloConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var createCardSchema = zod_1.z.object({
    key: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    listId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    desc: zod_1.z.string().optional(),
    due: zod_1.z.string().optional(),
});
var moveCardSchema = zod_1.z.object({
    key: zod_1.z.string().optional(),
    token: zod_1.z.string().optional(),
    cardId: zod_1.z.string().min(1),
    listId: zod_1.z.string().min(1),
});
function resolveAuth(auth, input) {
    var apiKey = input.key || auth.apiKey;
    var apiToken = input.token || auth.apiSecret || auth.accessToken;
    if (!apiKey || !apiToken) {
        throw new Error("Trello connector requires an API key and token");
    }
    return { apiKey: apiKey, apiToken: apiToken };
}
function trelloFetch(path_1, auth_1, params_1) {
    return __awaiter(this, arguments, void 0, function (path, auth, params, init) {
        var url, search, _i, _a, _b, key, value, response, text;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = new URL("https://api.trello.com/1/".concat(path));
                    search = new URLSearchParams({
                        key: auth.apiKey || "",
                        token: auth.apiSecret || auth.apiKey || "",
                    });
                    for (_i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        search.set(key, value);
                    }
                    url.search = search.toString();
                    return [4 /*yield*/, fetch(url.toString(), __assign(__assign({}, init), { headers: __assign({ "Content-Type": "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _c.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _c.sent();
                    throw new Error("Trello API error ".concat(response.status, ": ").concat(text));
                case 3:
                    if (response.status === 204) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, (_c.sent())];
            }
        });
    });
}
var TrelloConnector = /** @class */ (function (_super) {
    __extends(TrelloConnector, _super);
    function TrelloConnector() {
        var _this = _super.call(this, {
            name: "trello",
            displayName: "Trello",
            description: "Create and manage Trello cards.",
            category: "productivity",
            iconUrl: "https://trello.com/favicon.ico",
            websiteUrl: "https://trello.com",
            authType: "api_key",
            authConfig: {
                requiredFields: ["apiKey", "apiToken"],
            },
        }) || this;
        _this.actions = [
            {
                id: "createCard",
                name: "Create Card",
                description: "Create a Trello card in the specified list.",
                inputSchema: createCardSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, _c, apiKey, apiToken, result;
                    var _this = this;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = createCardSchema.parse(input);
                                _c = resolveAuth(auth, payload), apiKey = _c.apiKey, apiToken = _c.apiToken;
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return fetch("https://api.trello.com/1/cards", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                idList: payload.listId,
                                                name: payload.name,
                                                desc: payload.desc,
                                                due: payload.due,
                                                key: apiKey,
                                                token: apiToken,
                                            }),
                                        }).then(function (res) { return __awaiter(_this, void 0, void 0, function () {
                                            var text;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!!res.ok) return [3 /*break*/, 2];
                                                        return [4 /*yield*/, res.text()];
                                                    case 1:
                                                        text = _a.sent();
                                                        throw new Error("Trello API error ".concat(res.status, ": ").concat(text));
                                                    case 2: return [2 /*return*/, res.json()];
                                                }
                                            });
                                        }); });
                                    })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, result];
                        }
                    });
                }); },
            },
            {
                id: "moveCard",
                name: "Move Card",
                description: "Move an existing card to another list.",
                inputSchema: moveCardSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, _c, apiKey, apiToken, url, result;
                    var _this = this;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = moveCardSchema.parse(input);
                                _c = resolveAuth(auth, payload), apiKey = _c.apiKey, apiToken = _c.apiToken;
                                url = new URL("https://api.trello.com/1/cards/".concat(payload.cardId));
                                url.searchParams.set("key", apiKey);
                                url.searchParams.set("token", apiToken);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return __awaiter(_this, void 0, void 0, function () {
                                        var res, text;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, fetch(url.toString(), {
                                                        method: "PUT",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ idList: payload.listId }),
                                                    })];
                                                case 1:
                                                    res = _a.sent();
                                                    if (!!res.ok) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, res.text()];
                                                case 2:
                                                    text = _a.sent();
                                                    throw new Error("Trello API error ".concat(res.status, ": ").concat(text));
                                                case 3: return [2 /*return*/, res.json()];
                                            }
                                        });
                                    }); })];
                            case 1:
                                result = _d.sent();
                                return [2 /*return*/, result];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    TrelloConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!auth.apiKey || !auth.apiSecret)
                            return [2 /*return*/, false];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, trelloFetch("members/me", auth, {}, { method: "GET" })];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return TrelloConnector;
}(Connector_js_1.Connector));
exports.TrelloConnector = TrelloConnector;
