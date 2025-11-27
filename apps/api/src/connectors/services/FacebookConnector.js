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
exports.FacebookConnector = void 0;
var axios_1 = require("axios");
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var facebookCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Facebook access token is required"),
    pageId: zod_1.z.string().min(1, "Facebook page ID is required"),
    adAccountId: zod_1.z.string().min(1, "Facebook ad account ID is required"),
});
var createPostSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, "Message is required"),
    link: zod_1.z.string().url().optional(),
});
var createAdSchema = zod_1.z.object({
    campaignId: zod_1.z.string().min(1),
    creativeId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    status: zod_1.z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
});
var pageInsightsSchema = zod_1.z.object({
    metric: zod_1.z.string().min(1),
    period: zod_1.z.enum(["day", "week", "days_28"]).default("day"),
});
function resolveCredentials(auth) {
    var _a, _b, _c, _d, _e;
    var accessToken = (_b = (_a = auth.accessToken) !== null && _a !== void 0 ? _a : auth.apiKey) !== null && _b !== void 0 ? _b : (_c = auth.metadata) === null || _c === void 0 ? void 0 : _c.accessToken;
    var pageId = (_d = auth.metadata) === null || _d === void 0 ? void 0 : _d.pageId;
    var adAccountId = (_e = auth.metadata) === null || _e === void 0 ? void 0 : _e.adAccountId;
    var parsed = facebookCredentialsSchema.safeParse({ accessToken: accessToken, pageId: pageId, adAccountId: adAccountId });
    if (!parsed.success) {
        throw new Error(parsed.error.errors.map(function (err) { return err.message; }).join(", "));
    }
    return parsed.data;
}
var GRAPH_BASE = "https://graph.facebook.com/v18.0";
function facebookRequest(method, path, creds, params) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "".concat(GRAPH_BASE, "/").concat(path);
                    return [4 /*yield*/, (0, axios_1.default)({
                            method: method,
                            url: url,
                            params: method === "GET" ? __assign(__assign({}, params), { access_token: creds.accessToken }) : undefined,
                            data: method === "POST" ? __assign(__assign({}, params), { access_token: creds.accessToken }) : undefined,
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
var FacebookConnector = /** @class */ (function (_super) {
    __extends(FacebookConnector, _super);
    function FacebookConnector() {
        var _this = _super.call(this, {
            name: "facebook",
            displayName: "Facebook",
            description: "Manage Facebook pages and ads via the Marketing API.",
            category: "social",
            iconUrl: "https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico",
            websiteUrl: "https://www.facebook.com",
            authType: "oauth2",
            authConfig: {
                authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
                tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
                scopes: ["pages_manage_posts", "pages_read_engagement", "ads_management", "pages_read_engagement"],
            },
        }) || this;
        _this.actions = [
            {
                id: "createPost",
                name: "Create Page Post",
                description: "Publish a post to a Facebook page feed.",
                inputSchema: createPostSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createPostSchema.parse(input);
                                creds = this.getCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return facebookRequest("POST", "".concat(creds.pageId, "/feed"), creds, {
                                            message: payload.message,
                                            link: payload.link,
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, { postId: result.id }];
                        }
                    });
                }); },
            },
            {
                id: "createAd",
                name: "Create Ad",
                description: "Create an ad under an existing campaign using a prepared creative.",
                inputSchema: createAdSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = createAdSchema.parse(input);
                                creds = this.getCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return facebookRequest("POST", "".concat(creds.adAccountId, "/ads"), creds, {
                                            name: payload.name,
                                            status: payload.status,
                                            campaign_id: payload.campaignId,
                                            creative: { creative_id: payload.creativeId },
                                        });
                                    })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, { adId: result.id }];
                        }
                    });
                }); },
            },
            {
                id: "getPageInsights",
                name: "Get Page Insights",
                description: "Fetch insights for a Facebook page.",
                inputSchema: pageInsightsSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, result, insightMap, _i, _c, entry, latest;
                    var _d, _e;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                payload = pageInsightsSchema.parse(input);
                                creds = this.getCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return facebookRequest("GET", "".concat(creds.pageId, "/insights"), creds, {
                                            metric: payload.metric,
                                            period: payload.period,
                                        });
                                    })];
                            case 1:
                                result = _f.sent();
                                insightMap = {};
                                for (_i = 0, _c = (_d = result.data) !== null && _d !== void 0 ? _d : []; _i < _c.length; _i++) {
                                    entry = _c[_i];
                                    latest = (_e = entry.values.at(-1)) === null || _e === void 0 ? void 0 : _e.value;
                                    if (typeof latest === "number") {
                                        insightMap[entry.name] = latest;
                                    }
                                }
                                return [2 /*return*/, insightMap];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    FacebookConnector.prototype.getCredentials = function (auth) {
        return resolveCredentials(auth);
    };
    FacebookConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = this.getCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                return facebookRequest("GET", "me", creds_1, {
                                    fields: "id,name",
                                });
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return FacebookConnector;
}(Connector_js_1.Connector));
exports.FacebookConnector = FacebookConnector;
