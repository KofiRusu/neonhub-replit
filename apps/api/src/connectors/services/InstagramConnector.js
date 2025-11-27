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
exports.InstagramConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var instagramCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Instagram access token is required"),
    pageId: zod_1.z.string().min(1, "Instagram page ID is required"),
});
var publishPostSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url("Image URL must be valid"),
    caption: zod_1.z.string().max(2200).optional(),
});
var publishStorySchema = zod_1.z.object({
    mediaUrl: zod_1.z.string().url("Media URL must be valid"),
});
var insightsSchema = zod_1.z.object({
    postId: zod_1.z.string().min(1, "Post ID is required"),
});
function resolveCredentials(auth) {
    var _a, _b, _c, _d, _e;
    var accessToken = (_b = (_a = auth.accessToken) !== null && _a !== void 0 ? _a : auth.apiKey) !== null && _b !== void 0 ? _b : (_c = auth.metadata) === null || _c === void 0 ? void 0 : _c.accessToken;
    var pageId = (_e = (_d = auth.metadata) === null || _d === void 0 ? void 0 : _d.pageId) !== null && _e !== void 0 ? _e : auth.apiSecret;
    var parsed = instagramCredentialsSchema.safeParse({ accessToken: accessToken, pageId: pageId });
    if (!parsed.success) {
        throw new Error(parsed.error.errors.map(function (err) { return err.message; }).join(", "));
    }
    return parsed.data;
}
var API_BASE = "https://graph.instagram.com/v18.0";
function instagramFetch(path_1, creds_1) {
    return __awaiter(this, arguments, void 0, function (path, creds, init) {
        var url, response, text;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = new URL("".concat(API_BASE, "/").concat(path));
                    url.searchParams.set("access_token", creds.accessToken);
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, init), { headers: __assign({ "Content-Type": "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("Instagram API error ".concat(response.status, ": ").concat(text));
                case 3:
                    if (response.status === 204) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
function uploadMedia(creds, mediaUrl, caption) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, instagramFetch("".concat(creds.pageId, "/media"), creds, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            image_url: mediaUrl,
                            caption: caption,
                        }),
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.id];
            }
        });
    });
}
function publishContainer(creds, creationId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, instagramFetch("".concat(creds.pageId, "/media_publish"), creds, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ creation_id: creationId }),
                })];
        });
    });
}
function createStory(creds, mediaUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, instagramFetch("".concat(creds.pageId, "/media"), creds, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            media_type: "STORIES",
                            media_url: mediaUrl,
                        }),
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.id];
            }
        });
    });
}
var InstagramConnector = /** @class */ (function (_super) {
    __extends(InstagramConnector, _super);
    function InstagramConnector() {
        var _this = _super.call(this, {
            name: "instagram",
            displayName: "Instagram",
            description: "Publish media and retrieve insights through the Instagram Graph API.",
            category: "social",
            iconUrl: "https://static.xx.fbcdn.net/rsrc.php/ym/r/36B424nhiPl.ico",
            websiteUrl: "https://www.instagram.com",
            authType: "oauth2",
            authConfig: {
                authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
                tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
                scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights"],
            },
        }) || this;
        _this.actions = [
            {
                id: "publishPost",
                name: "Publish Post",
                description: "Publish an image post to Instagram with an optional caption.",
                inputSchema: publishPostSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, containerId, publishResult;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = publishPostSchema.parse(input);
                                creds = this.getCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return uploadMedia(creds, payload.imageUrl, payload.caption); })];
                            case 1:
                                containerId = _c.sent();
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return publishContainer(creds, containerId); })];
                            case 2:
                                publishResult = _c.sent();
                                return [2 /*return*/, {
                                        creationId: containerId,
                                        mediaId: publishResult.id,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "publishStory",
                name: "Publish Story",
                description: "Publish a story to Instagram using an external media URL.",
                inputSchema: publishStorySchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, creationId, publishResult;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = publishStorySchema.parse(input);
                                creds = this.getCredentials(auth);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return createStory(creds, payload.mediaUrl); })];
                            case 1:
                                creationId = _c.sent();
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return publishContainer(creds, creationId); })];
                            case 2:
                                publishResult = _c.sent();
                                return [2 /*return*/, {
                                        creationId: creationId,
                                        mediaId: publishResult.id,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "getInsights",
                name: "Get Insights",
                description: "Retrieve insights for a published Instagram media item.",
                inputSchema: insightsSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, creds, metrics, data, insightMap, _i, _c, entry, latest;
                    var _d;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                payload = insightsSchema.parse(input);
                                creds = this.getCredentials(auth);
                                metrics = ["impressions", "reach", "saved", "likes", "comments"].join(",");
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return instagramFetch("".concat(payload.postId, "/insights?metric=").concat(metrics), creds, { method: "GET" });
                                    })];
                            case 1:
                                data = (_e.sent()).data;
                                insightMap = {};
                                for (_i = 0, _c = data !== null && data !== void 0 ? data : []; _i < _c.length; _i++) {
                                    entry = _c[_i];
                                    latest = (_d = entry.values.at(-1)) === null || _d === void 0 ? void 0 : _d.value;
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
    InstagramConnector.prototype.getCredentials = function (auth) {
        return resolveCredentials(auth);
    };
    InstagramConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = this.getCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return instagramFetch("me", creds_1, { method: "GET" }); })];
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
    return InstagramConnector;
}(Connector_js_1.Connector));
exports.InstagramConnector = InstagramConnector;
