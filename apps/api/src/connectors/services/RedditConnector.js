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
exports.RedditConnector = void 0;
var snoowrap_1 = require("snoowrap");
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var redditCredentialsSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Reddit username is required"),
    password: zod_1.z.string().min(1, "Reddit password is required"),
    clientId: zod_1.z.string().min(1, "Reddit client ID is required"),
    clientSecret: zod_1.z.string().min(1, "Reddit client secret is required"),
    userAgent: zod_1.z
        .string()
        .min(1)
        .default("NeonHubRedditConnector/1.0 (+https://neonhub.ai)"),
});
var submitPostSchema = zod_1.z
    .object({
    subreddit: zod_1.z.string().min(2, "Subreddit is required"),
    title: zod_1.z.string().min(1, "Title is required").max(300),
    text: zod_1.z.string().optional(),
    url: zod_1.z.string().url().optional(),
    flairId: zod_1.z.string().optional(),
})
    .refine(function (payload) { return !!payload.text || !!payload.url; }, "Either text or url must be provided");
var submitCommentSchema = zod_1.z.object({
    submissionId: zod_1.z.string().min(3, "Submission ID is required"),
    body: zod_1.z.string().min(1, "Comment body is required"),
});
var subredditInfoSchema = zod_1.z.object({
    subreddit: zod_1.z.string().min(2, "Subreddit is required"),
});
function resolveCredentials(auth) {
    var _a, _b, _c;
    var metadata = (_a = auth.metadata) !== null && _a !== void 0 ? _a : {};
    return redditCredentialsSchema.parse({
        username: metadata.username,
        password: metadata.password,
        clientId: (_b = auth.apiKey) !== null && _b !== void 0 ? _b : metadata.clientId,
        clientSecret: (_c = auth.apiSecret) !== null && _c !== void 0 ? _c : metadata.clientSecret,
        userAgent: metadata.userAgent,
    });
}
function createClient(auth) {
    var creds = resolveCredentials(auth);
    return new snoowrap_1.default({
        userAgent: creds.userAgent,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        username: creds.username,
        password: creds.password,
    });
}
var RedditConnector = /** @class */ (function (_super) {
    __extends(RedditConnector, _super);
    function RedditConnector() {
        var _this = _super.call(this, {
            name: "reddit",
            displayName: "Reddit",
            description: "Publish posts, join discussions, and fetch subreddit insights from Reddit.",
            category: "social",
            iconUrl: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
            websiteUrl: "https://www.reddit.com",
            authType: "api_key",
            authConfig: {
                requiredFields: ["username", "password", "clientId", "clientSecret"],
                instructions: "Provide Reddit API credentials. Set clientId/clientSecret via apiKey/apiSecret, and username/password via metadata.",
            },
        }) || this;
        _this.actions = [
            {
                id: "submitPost",
                name: "Submit Post",
                description: "Publish a post to the specified subreddit.",
                inputSchema: submitPostSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, client, subreddit, submissionPromise, submission;
                    var _c;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                payload = submitPostSchema.parse(input);
                                client = this.getClient(auth);
                                subreddit = client.getSubreddit(payload.subreddit);
                                submissionPromise = payload.url
                                    ? subreddit.submitLink({
                                        title: payload.title,
                                        url: payload.url,
                                        flairId: payload.flairId,
                                    })
                                    : subreddit.submitSelfpost({
                                        title: payload.title,
                                        text: (_c = payload.text) !== null && _c !== void 0 ? _c : "",
                                        flairId: payload.flairId,
                                    });
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return Promise.resolve(submissionPromise);
                                    })];
                            case 1:
                                submission = (_d.sent());
                                return [2 /*return*/, {
                                        id: submission.id,
                                        name: submission.name,
                                        url: submission.url,
                                        permalink: submission.permalink,
                                        subreddit: submission.subreddit_name_prefixed,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "submitComment",
                name: "Submit Comment",
                description: "Reply to an existing Reddit submission.",
                inputSchema: submitCommentSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, client, submission, commentPromise, comment;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = submitCommentSchema.parse(input);
                                client = this.getClient(auth);
                                submission = client.getSubmission(payload.submissionId);
                                commentPromise = submission.reply(payload.body);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return Promise.resolve(commentPromise);
                                    })];
                            case 1:
                                comment = (_c.sent());
                                return [2 /*return*/, {
                                        id: comment.id,
                                        name: comment.name,
                                        body: comment.body,
                                        permalink: comment.permalink,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "getSubredditInfo",
                name: "Get Subreddit Info",
                description: "Fetch metadata about a subreddit including subscriber counts and moderation status.",
                inputSchema: subredditInfoSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var payload, client, subreddit, infoPromise, info;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                payload = subredditInfoSchema.parse(input);
                                client = this.getClient(auth);
                                subreddit = client.getSubreddit(payload.subreddit);
                                infoPromise = subreddit.fetch();
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () {
                                        return Promise.resolve(infoPromise);
                                    })];
                            case 1:
                                info = (_c.sent());
                                return [2 /*return*/, {
                                        id: info.id,
                                        name: info.display_name,
                                        title: info.title,
                                        description: info.public_description,
                                        subscribers: info.subscribers,
                                        activeAccounts: info.accounts_active_is_fuzzed ? undefined : info.active_user_count,
                                        over18: info.over18,
                                    }];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    RedditConnector.prototype.getClient = function (auth) {
        return createClient(auth);
    };
    RedditConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var client_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        client_1 = this.getClient(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return Promise.resolve(client_1.getMe()); })];
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
    return RedditConnector;
}(Connector_js_1.Connector));
exports.RedditConnector = RedditConnector;
