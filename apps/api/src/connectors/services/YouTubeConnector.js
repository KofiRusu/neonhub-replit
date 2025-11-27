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
exports.YouTubeConnector = void 0;
var googleapis_1 = require("googleapis");
var node_fs_1 = require("node:fs");
var node_stream_1 = require("node:stream");
var zod_1 = require("zod");
var Connector_js_1 = require("../base/Connector.js");
var RetryManager_js_1 = require("../execution/RetryManager.js");
var youtubeCredentialsSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, "Google access token is required"),
    refreshToken: zod_1.z.string().min(1, "Google refresh token is required"),
    clientId: zod_1.z.string().min(1, "Google client ID is required"),
    clientSecret: zod_1.z.string().min(1, "Google client secret is required"),
    channelId: zod_1.z.string().min(1, "YouTube channel ID is required"),
});
var uploadVideoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().default(""),
    videoFile: zod_1.z.string().min(1, "Video file path is required"),
    privacyStatus: zod_1.z.enum(["public", "private", "unlisted"]).default("private"),
});
var updateVideoSchema = zod_1.z.object({
    videoId: zod_1.z.string().min(1),
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    categoryId: zod_1.z.string().optional(),
});
var statsSchema = zod_1.z.object({
    videoId: zod_1.z.string().min(1),
});
function resolveCredentials(auth) {
    var _a, _b, _c;
    var metadata = (_a = auth.metadata) !== null && _a !== void 0 ? _a : {};
    var parsed = youtubeCredentialsSchema.parse({
        accessToken: (_b = auth.accessToken) !== null && _b !== void 0 ? _b : metadata.accessToken,
        refreshToken: (_c = metadata.refreshToken) !== null && _c !== void 0 ? _c : auth.refreshToken,
        clientId: metadata.clientId,
        clientSecret: metadata.clientSecret,
        channelId: metadata.channelId,
    });
    return parsed;
}
function createYouTubeClient(creds) {
    var oauth2Client = new googleapis_1.google.auth.OAuth2({
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
    });
    oauth2Client.setCredentials({
        access_token: creds.accessToken,
        refresh_token: creds.refreshToken,
    });
    return googleapis_1.google.youtube({ version: "v3", auth: oauth2Client });
}
function uploadVideo(creds, params) {
    return __awaiter(this, void 0, void 0, function () {
        var youtube, fileStream, passthrough, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    youtube = createYouTubeClient(creds);
                    fileStream = node_fs_1.default.createReadStream(params.videoFile);
                    passthrough = new node_stream_1.PassThrough();
                    fileStream.pipe(passthrough);
                    return [4 /*yield*/, youtube.videos.insert({
                            part: ["snippet", "status"],
                            requestBody: {
                                snippet: {
                                    title: params.title,
                                    description: params.description,
                                    channelId: creds.channelId,
                                },
                                status: {
                                    privacyStatus: params.privacyStatus,
                                },
                            },
                            media: {
                                body: passthrough,
                            },
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
function updateVideo(creds, params) {
    return __awaiter(this, void 0, void 0, function () {
        var youtube, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    youtube = createYouTubeClient(creds);
                    return [4 /*yield*/, youtube.videos.update({
                            part: ["snippet"],
                            requestBody: {
                                id: params.videoId,
                                snippet: {
                                    title: params.title,
                                    description: params.description,
                                    tags: params.tags,
                                    categoryId: params.categoryId,
                                },
                            },
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
function getVideoStatistics(creds, videoId) {
    return __awaiter(this, void 0, void 0, function () {
        var youtube, response, item;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    youtube = createYouTubeClient(creds);
                    return [4 /*yield*/, youtube.videos.list({
                            id: [videoId],
                            part: ["statistics"],
                        })];
                case 1:
                    response = _e.sent();
                    item = (_a = response.data.items) === null || _a === void 0 ? void 0 : _a[0];
                    if (!(item === null || item === void 0 ? void 0 : item.statistics)) {
                        return [2 /*return*/, {}];
                    }
                    return [2 /*return*/, {
                            views: Number((_b = item.statistics.viewCount) !== null && _b !== void 0 ? _b : 0),
                            likes: Number((_c = item.statistics.likeCount) !== null && _c !== void 0 ? _c : 0),
                            comments: Number((_d = item.statistics.commentCount) !== null && _d !== void 0 ? _d : 0),
                        }];
            }
        });
    });
}
var YouTubeConnector = /** @class */ (function (_super) {
    __extends(YouTubeConnector, _super);
    function YouTubeConnector() {
        var _this = _super.call(this, {
            name: "youtube",
            displayName: "YouTube",
            description: "Upload videos and manage metadata via the YouTube Data API.",
            category: "social",
            iconUrl: "https://www.youtube.com/s/desktop/6f3e1dba/img/favicon_32x32.png",
            websiteUrl: "https://www.youtube.com",
            authType: "oauth2",
            authConfig: {
                authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
                tokenUrl: "https://oauth2.googleapis.com/token",
                scopes: [
                    "https://www.googleapis.com/auth/youtube.upload",
                    "https://www.googleapis.com/auth/youtube",
                    "https://www.googleapis.com/auth/youtube.readonly",
                ],
            },
        }) || this;
        _this.actions = [
            {
                id: "uploadVideo",
                name: "Upload Video",
                description: "Upload a new video to YouTube using resumable upload.",
                inputSchema: uploadVideoSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var creds, payload, video;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                creds = this.getCredentials(auth);
                                payload = uploadVideoSchema.parse(input);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return uploadVideo(creds, payload); })];
                            case 1:
                                video = _c.sent();
                                return [2 /*return*/, {
                                        videoId: video.id,
                                        etag: video.etag,
                                    }];
                        }
                    });
                }); },
            },
            {
                id: "updateVideo",
                name: "Update Video Metadata",
                description: "Update details for an existing YouTube video.",
                inputSchema: updateVideoSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var creds, payload, result;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                creds = this.getCredentials(auth);
                                payload = updateVideoSchema.parse(input);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return updateVideo(creds, payload); })];
                            case 1:
                                result = _c.sent();
                                return [2 /*return*/, result];
                        }
                    });
                }); },
            },
            {
                id: "getVideoStats",
                name: "Get Video Stats",
                description: "Retrieve statistics for a YouTube video.",
                inputSchema: statsSchema,
                execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                    var creds, payload, stats;
                    var auth = _b.auth, input = _b.input;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                creds = this.getCredentials(auth);
                                payload = statsSchema.parse(input);
                                return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return getVideoStatistics(creds, payload.videoId); })];
                            case 1:
                                stats = _c.sent();
                                return [2 /*return*/, stats];
                        }
                    });
                }); },
            },
        ];
        _this.triggers = [];
        return _this;
    }
    YouTubeConnector.prototype.getCredentials = function (auth) {
        return resolveCredentials(auth);
    };
    YouTubeConnector.prototype.testConnection = function (auth) {
        return __awaiter(this, void 0, void 0, function () {
            var creds_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        creds_1 = this.getCredentials(auth);
                        return [4 /*yield*/, RetryManager_js_1.retryManager.run(function () { return getVideoStatistics(creds_1, "dQw4w9WgXcQ"); })];
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
    return YouTubeConnector;
}(Connector_js_1.Connector));
exports.YouTubeConnector = YouTubeConnector;
