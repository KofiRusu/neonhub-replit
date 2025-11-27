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
exports.TwitterConnector = void 0;
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var postTweetSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(280),
    replyTo: zod_1.z.string().optional(),
});
var searchTweetsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    maxResults: zod_1.z.number().min(10).max(100).default(25),
});
function twitterFetch(auth_1, path_1) {
    return __awaiter(this, arguments, void 0, function (auth, path, init) {
        var token, response, text;
        if (init === void 0) { init = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = auth.accessToken || auth.apiKey;
                    if (!token)
                        throw new Error("Twitter connector requires a bearer token");
                    return [4 /*yield*/, fetch("https://api.twitter.com/".concat(path), __assign(__assign({}, init), { headers: __assign({ Authorization: "Bearer ".concat(token), "Content-Type": "application/json" }, (init.headers || {})) }))];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("Twitter API error ".concat(response.status, ": ").concat(text));
                case 3: return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
var TwitterConnector = /** @class */ (function (_super) {
    __extends(TwitterConnector, _super);
    function TwitterConnector() {
        var _this = _super.call(this, {
            name: "twitter",
            displayName: "Twitter / X",
            description: "Publish tweets and monitor conversations on Twitter.",
            category: "social",
            iconUrl: "https://abs.twimg.com/favicons/twitter.ico",
            websiteUrl: "https://twitter.com",
            authType: "api_key",
            authConfig: {
                requiredFields: ["accessToken"],
            },
        }) || this;
        _this.actions = [
            {
                id: "postTweet",
                name: "Post Tweet",
                description: "Publish a tweet using the authenticated account.",
                inputSchema: postTweetSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        payload = postTweetSchema.parse(input);
                        return [2 /*return*/, RetryManager_js_1.retryManager.run(function () {
                                return twitterFetch(auth, "2/tweets", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        text: payload.text,
                                        reply: payload.replyTo ? { in_reply_to_tweet_id: payload.replyTo } : undefined,
                                    }),
                                });
                            })];
                    });
                }); },
            },
        ];
        _this.triggers = [
            {
                id: "searchTweets",
                name: "Search Tweets",
                description: "Triggers with the latest tweets that match a query.",
                pollingIntervalSeconds: 120,
                inputSchema: searchTweetsSchema,
                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, params, result;
                    var _c, _d, _e;
                    var auth = _b.auth, settings = _b.settings, cursor = _b.cursor;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                payload = searchTweetsSchema.parse(settings !== null && settings !== void 0 ? settings : {});
                                params = new URLSearchParams({
                                    query: payload.query,
                                    max_results: String(payload.maxResults),
                                    "tweet.fields": "created_at,author_id",
                                });
                                if (cursor)
                                    params.set("next_token", cursor);
                                return [4 /*yield*/, twitterFetch(auth, "2/tweets/search/recent?".concat(params.toString()), { method: "GET" })];
                            case 1:
                                result = _f.sent();
                                return [2 /*return*/, {
                                        cursor: (_d = (_c = result.meta) === null || _c === void 0 ? void 0 : _c.next_token) !== null && _d !== void 0 ? _d : null,
                                        items: (_e = result.data) !== null && _e !== void 0 ? _e : [],
                                    }];
                        }
                    });
                }); },
            },
        ];
        return _this;
    }
    TwitterConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, twitterFetch(auth, "2/users/me", { method: "GET" })];
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
    return TwitterConnector;
}(Connector_js_1.Connector));
exports.TwitterConnector = TwitterConnector;
